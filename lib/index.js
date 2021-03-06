"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var request_1 = __importDefault(require("request"));
var interface_1 = require("./interface");
var defaultProviders = [
    "http://ip-api.com/json/*",
    "https://ipapi.co/json/*",
    "https://extreme-ip-lookup.com/json/*",
    "http://free.ipwhois.io/json/*",
    "https://freegeoip.app/json/*",
    "https://get.geojs.io/v1/ip/geo.json*"
];
var log = debug_1.default("iplocation");
var InvalidIPError = /** @class */ (function (_super) {
    __extends(InvalidIPError, _super);
    function InvalidIPError() {
        var _this = _super.call(this) || this;
        _this.message = "Invalid IP address.";
        return _this;
    }
    return InvalidIPError;
}(Error));
var ProviderError = /** @class */ (function (_super) {
    __extends(ProviderError, _super);
    function ProviderError() {
        var _this = _super.call(this) || this;
        _this.message = "All providers failed.";
        return _this;
    }
    return ProviderError;
}(Error));
function default_1(ip, additionalProviders, callback) {
    var providers = (additionalProviders || [])
        .concat(defaultProviders);
    if (interface_1.validateIp(ip)) {
        return callback
            ? callback(new InvalidIPError(), null)
            : Promise.reject(new InvalidIPError());
    }
    function retry(i, callback) {
        if (!providers[i]) {
            return callback(new ProviderError(), null);
        }
        var url = providers[i].replace("*", ip || "");
        log("trying: " + url);
        request_1.default.get(url, { withCredentials: false }, function (err, response, body) {
            var json;
            try {
                log("got: " + body);
                json = JSON.parse(body);
                if (json.error || (!json.country && json.message)) {
                    return retry(++i, callback);
                }
            }
            catch (ex) {
                return retry(++i, callback);
            }
            var normalised = interface_1.normalise(json);
            log("returned: ", normalised);
            return callback(err, normalised);
        });
    }
    if (callback) {
        retry(0, callback);
    }
    else {
        return new Promise(function (resolve, reject) {
            retry(0, function (err, res) {
                if (err)
                    return reject(err);
                resolve(res);
            });
        });
    }
}
exports.default = default_1;
