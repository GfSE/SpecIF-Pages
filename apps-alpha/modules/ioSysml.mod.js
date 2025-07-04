"use strict";
/*!	SysML import and export
    Dependencies:
    (C)copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
moduleManager.construct({
    name: 'ioSysml'
}, function (self) {
    var fDate, fName, zipped, mime, errNoXMIFile = new resultMsg(897, 'No XMI file found in the container.'), errInvalidXML = new resultMsg(898, 'XMI data is not valid XML.');
    self.init = function (options) {
        mime = undefined;
        return true;
    };
    self.verify = function (f) {
        function sysmlFile2mediaType(fname) {
            if (fname.endsWith('.mdzip')) {
                zipped = true;
                return 'application/zip';
            }
            ;
            return '';
        }
        fName = f.name.split('\\').pop().split('/').pop();
        if (f.lastModified) {
            fDate = new Date(f.lastModified).toISOString();
        }
        else {
            fDate = new Date().toISOString();
        }
        ;
        mime = sysmlFile2mediaType(f.name);
        if (mime)
            return true;
        message.show(i18n.lookup('ErrInvalidFileSysml', f.name));
        return false;
    };
    self.toSpecif = function (buf) {
        let sDO = $.Deferred(), modelL = [], sharedL = [], resL = [], xOpts = {
            fileName: fName,
            fileDate: fDate,
            titleLength: CONFIG.maxTitleLength,
            textLength: CONFIG.maxStringLength,
            modelElementClasses: app.ontology.modelElementClasses
        };
        self.abortFlag = false;
        if (zipped) {
            new JSZip().loadAsync(buf)
                .then(async (zip) => {
                modelL = zip.filter((relPath, file) => file.name.endsWith('.uml_model.model'));
                sharedL = zip.filter((relPath, file) => file.name.endsWith('.uml_model.shared_model'));
                if (modelL.length < 1) {
                    sDO.reject(errNoXMIFile);
                    return;
                }
                ;
                if (modelL.length > 1) {
                    console.warn("SysML Import: More than one model file found in container");
                }
                ;
                async function processFilesSequentially(files) {
                    for (const file of files) {
                        const xmi = await zip.file(file.name).async("string");
                        const ok = await new Promise((resolve, reject) => {
                            xlateWithCallback(xmi, resolve, reject);
                        });
                        if (!ok)
                            return;
                    }
                    sDO.resolve(resL);
                }
                function xlateWithCallback(xmi, resolve, reject) {
                    if (!LIB.validXML(xmi)) {
                        sDO.reject(errInvalidXML);
                        resolve(false);
                        return;
                    }
                    let result = sysml2specif(xmi, xOpts);
                    if (result.ok()) {
                        resL.push(result.response);
                        resolve(true);
                    }
                    else {
                        sDO.reject(result);
                        resolve(false);
                    }
                }
                const allFiles = [modelL[0], ...sharedL];
                processFilesSequentially(allFiles);
            });
        }
        else {
            sDO.reject(new resultMsg(899, 'SysML Import: Input file is not supported'));
        }
        ;
        return sDO;
    };
    self.abort = function () {
        self.abortFlag = true;
    };
    return self;
});
