"use strict";
/*!	SysML import and export
    Dependencies:
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'ioSysml'
}, function (self) {
    var fDate, fName, data, mime;
    self.init = function () {
        return true;
    };
    self.verify = function (f) {
        function sysmlFile2mediaType(fname) {
            if (fname.endsWith('.xmi') || fname.endsWith('.xml'))
                return 'application/vnd.xmi+xml';
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
        self.abortFlag = false;
        var sDO = $.Deferred();
        data = sysml2specif(LIB.ab2str(buf), {
            fileName: fName,
            fileDate: fDate,
            titleLength: CONFIG.maxTitleLength,
            textLength: CONFIG.maxStringLength,
            modelElementClasses: app.ontology.modelElementClasses
        });
        if (data)
            sDO.resolve(data);
        else
            sDO.reject(new xhrMessage(999, "Invalid XMI-File: exporter must be MagicDraw 19.0"));
        ;
        return sDO;
    };
    self.abort = function () {
        self.abortFlag = true;
    };
    return self;
});
