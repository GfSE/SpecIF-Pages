"use strict";
/*!	Standard type definitions with methods.
    Dependencies: -
    (C)copyright enso managers gmbh (http://enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.com, Berlin
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
class CStandards {
    constructor() {
        this.listName = new Map([
            ['dataType', "dataTypes"],
            ['propertyClass', "propertyClasses"],
            ['resourceClass', "resourceClasses"],
            ['statementClass', "statementClasses"],
            ['file', "files"],
            ['resource', "resources"],
            ['statement', "statements"],
            ['hierarchy', "nodes"]
        ]);
    }
    ;
    iterateLists(fn) {
        for (var ctg of this.listName.keys())
            fn(ctg, this.listName.get(ctg));
        return this.listName.size;
    }
    makeTemplate() {
        let tmp = {
            "@context": "http://purl.org/dc/terms/",
            "id": "",
            "$schema": "https://specif.de/v" + CONFIG.specifVersion + "/schema#",
            "title": [],
            "description": undefined,
            "generator": app.title,
            "generatorVersion": CONFIG.appVersion,
            "createdAt": new Date().toISOString(),
            "rights": {
                "title": "Creative Commons 4.0 CC BY-SA",
                "url": "https://creativecommons.org/licenses/by-sa/4.0/"
            }
        };
        this.iterateLists((ctg, listName) => {
            tmp[listName] = [];
        });
        return tmp;
    }
}
;
