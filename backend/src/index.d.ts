export interface NotionDatabase {
    object: "database";
    id: string;
    cover: null;
    icon: null;
    created_time: string;
    created_by: {
      object: "user";
      id: string;
    };
    last_edited_by: {
      object: "user";
      id: string;
    };
    last_edited_time: string;
    title: [
      {
        type: "text";
        text: {
          content: string;
        };
        annotations: {
          [key: string]: boolean;
        };
        plain_text: string;
        href: null;
      }
    ];
    description: [];
    is_inline: false;
    properties: {
      [key: string]: {
        id: string;
        name: string;
        type: string;
        [key: string]: any;
      };
    };
    parent: {
      type: "workspace";
      workspace: true;
    };
    url: string;
    archived: boolean;
  }