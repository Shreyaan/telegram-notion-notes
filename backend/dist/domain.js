"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.port = exports.domain = void 0;
exports.domain = process.env.DOMAIN;
exports.port = process.env.PORT;
if (exports.domain === undefined) {
    exports.domain = "localhost";
}
if (exports.port === undefined) {
    exports.port = "3000";
}
//# sourceMappingURL=domain.js.map