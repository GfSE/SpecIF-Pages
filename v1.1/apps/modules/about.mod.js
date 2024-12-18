"use strict";
/*!	Short Description of the SpecIF Viewer with a List of all used libraries and their respective licenses.
    Dependencies: jQuery
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'about'
}, function (self) {
    self.init = function () {
        return true;
    };
    self.clear = function () {
        $('#about').empty();
    };
    self.hide = function () {
        self.clear();
    };
    self.show = function (opts) {
        if (!(opts && opts.urlParams))
            setUrlParams({
                view: self.view.substring(1)
            });
        $('#pageTitle').html(app.title);
        $('#about').html('<iframe id="aboutFrame" '
            + 'src="./index.html" '
            + 'title="About SpecIF Apps" '
            + 'style="width: 100%; border: none; margin: 0; padding: 0; height: 100%;" '
            + '/>');
    };
    return self;
});
