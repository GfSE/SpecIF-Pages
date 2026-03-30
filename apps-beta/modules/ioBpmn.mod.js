"use strict";
/*!	iLaH: BPMN import
    Dependencies: jQuery 3.0+
    (C)copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
moduleManager.construct({
    name: 'ioBpmn'
}, function (self) {
    var options, fDate, fName, data, bDO;
    self.init = function (opts) {
        options = opts;
        return true;
    };
    self.verify = function (f) {
        function isBpmn(fname) {
            return fname.endsWith('.bpmn');
        }
        if (!isBpmn(f.name)) {
            message.show(i18n.lookup('ErrInvalidFileBpmn', f.name));
            return false;
        }
        ;
        fName = f.name.split('\\').pop().split('/').pop();
        if (f.lastModified) {
            fDate = new Date(f.lastModified).toISOString();
        }
        else {
            fDate = new Date().toISOString();
        }
        ;
        return true;
    };
    self.toSpecif = function (buf) {
        self.abortFlag = false;
        bDO = $.Deferred();
        let mMime = "application/bpmn+xml", xml = LIB.ab2str(buf), iName = fName.fileName() + '.svg', iMime = 'image/svg+xml';
        data = BPMN2Specif(xml, {
            imgName: iName,
            imgMime: iMime,
            modified: fDate,
            titleLength: CONFIG.maxTitleLength,
            textLength: CONFIG.maxStringLength,
            strRoleType: CONFIG.resClassRole,
            strConditionType: CONFIG.resClassCondition,
            strBusinessProcessType: CONFIG.resClassProcess,
            strBusinessProcessesType: CONFIG.resClassProcesses,
            strBusinessProcessFolder: CONFIG.resClassProcesses
        });
        if (options.ingest.includes("source"))
            data.files.push({
                id: 'F-' + simpleHash(fName),
                title: fName,
                blob: new Blob([xml], { type: mMime }),
                type: mMime,
                changedAt: fDate
            });
        if (!document.querySelector("#bpmnView"))
            $('#app').after('<div id="bpmnView"></div>');
        bpmn2svg(xml).then((result) => {
            data.files.push({
                id: 'F-' + simpleHash(iName),
                title: iName,
                blob: new Blob([result.svg], { type: iMime }),
                type: iMime,
                changedAt: fDate
            });
            finalize();
        }, bDO.reject);
        return bDO;
        function finalize() {
            if (typeof (data) == 'object' && data.id)
                bDO.resolve(data);
            else
                bDO.reject(new resultMsg({ status: 999, statusText: 'Input file could not be transformed to SpecIF' }));
            $("#bpmnView").remove();
        }
    };
    self.abort = function () {
        app.projects.abort();
        self.abortFlag = true;
    };
    return self;
    function bpmn2svg(xml) {
        return new Promise((resolve, reject) => {
            var bpmnViewer = new BpmnJS({ container: '#bpmnView' });
            bpmnViewer.importXML(xml)
                .then(() => {
                resolve(bpmnViewer.saveSVG());
            })
                .catch(reject)
                .finally(() => {
                $('#bpmnView').empty();
            });
        });
    }
});
