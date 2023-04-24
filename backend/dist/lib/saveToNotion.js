"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToNotion = void 0;
const client_1 = require("@notionhq/client");
function saveToNotion(user, textToSend, ctx) {
    const notion = new client_1.Client({ auth: user.token });
    try {
        (async () => {
            if (user.pageId === undefined) {
                return;
            }
            const response = await notion.pages.create({
                parent: {
                    type: "database_id",
                    database_id: user.pageId,
                },
                properties: {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: textToSend.summary.substring(0, 30),
                                },
                            },
                        ],
                    },
                },
                children: [
                    {
                        object: "block",
                        heading_3: {
                            rich_text: [
                                {
                                    text: {
                                        content: textToSend.summary,
                                    },
                                },
                            ],
                            color: "default",
                        },
                    },
                    {
                        object: "block",
                        paragraph: {
                            rich_text: [
                                {
                                    text: {
                                        content: textToSend.textToSummarize.substring(0, 1999),
                                    },
                                },
                            ],
                            color: "default",
                        },
                    },
                ],
            });
            ctx.reply("added to notion");
        })();
    }
    catch (error) {
        ctx.reply("Something went wrong. Please check you have set your db id correctly. Send /selectnotiondb to set your db id");
    }
}
exports.saveToNotion = saveToNotion;
//# sourceMappingURL=saveToNotion.js.map