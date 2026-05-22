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
    var fDate, fName, zipped, mime, errNoXMIFile = new resultMsg({ status: 897, statusText: 'No XMI file found in the container.' }), errInvalidXML = new resultMsg({ status: 898, statusText: 'XMI data is not valid XML.' });
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
        let sDO = $.Deferred(), xOpts = {
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
                const modelL = zip.filter((relPath, file) => file.name.endsWith('.uml_model.model')), sharedL = zip.filter((relPath, file) => file.name.endsWith('.uml_model.shared_model')), resL = [];
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
                        if (!LIB.validXML(xmi)) {
                            sDO.reject(errInvalidXML);
                            return;
                        }
                        const result = sysml2specif(xmi, xOpts);
                        if (result.ok) {
                            resL.push(result.response);
                        }
                        else {
                            sDO.reject(result);
                            return;
                        }
                    }
                    sDO.resolve(resL);
                }
                const allFiles = [modelL[0], ...sharedL];
                await processFilesSequentially(allFiles);
            });
        }
        else {
            sDO.reject(new resultMsg({ status: 899, statusText: 'SysML Import: Input file is not supported' }));
        }
        ;
        return sDO;
    };
    self.abort = function () {
        self.abortFlag = true;
    };
    return self;
});
