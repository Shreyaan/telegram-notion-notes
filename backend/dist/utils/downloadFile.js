"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = void 0;
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
async function downloadFile(fileUrl, outputLocationPath) {
    const writer = (0, fs_1.createWriteStream)(outputLocationPath);
    return (0, axios_1.default)({
        method: "get",
        url: fileUrl,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        responseType: "stream",
    }).then((response) => {
        //ensure that the user can call `then()` only when the file has
        //been downloaded entirely.
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on("error", (err) => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on("close", () => {
                if (!error) {
                    resolve(true);
                }
                //no need to call the reject here, as it will have been called in the
                //'error' stream;
            });
        });
    });
}
exports.downloadFile = downloadFile;
//# sourceMappingURL=downloadFile.js.map