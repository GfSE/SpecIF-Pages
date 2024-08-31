"use strict";
function SpecifApp() {
    "use strict";
    var self = {};
    self.moduleTree = {
        view: '#app',
        selector: '#pageSelector',
        selectorType: 'btns',
        children: [{
                name: 'profileAnonymous',
                loadAs: 'me'
            }, {
                name: 'cache',
                loadAs: 'projects'
            }, {
                name: 'importAny',
                view: '#' + CONFIG.importAny,
                viewClass: 'contentWide',
                label: i18n.BtnImport,
                selectedBy: '#selectImport',
                children: [{
                        name: 'ioSpecif'
                    }, {
                        name: 'ioReqif'
                    }, {
                        name: 'ioArchimate'
                    }, {
                        name: 'ioBpmn'
                    }, {
                        name: 'ioXls'
                    }]
            }, {
                name: CONFIG.specifications,
                loadAs: 'specs',
                view: '#' + CONFIG.specifications,
                label: i18n.BtnRead,
                selectedBy: '#selectSpecs',
                selector: '#specsSelector',
                selectorType: 'tabs',
                children: [{
                        view: '#' + CONFIG.objectList,
                        byDefault: true,
                        viewClass: 'content',
                        label: i18n.TabDocument,
                        selectedBy: '#selectDocument'
                    }, {
                        view: '#' + CONFIG.relations,
                        viewClass: 'content',
                        label: i18n.TabRelations,
                        selectedBy: '#selectStatements',
                        children: [{
                                name: 'vicinityGraph'
                            }]
                    }, {
                        name: CONFIG.objectFilter,
                        view: '#' + CONFIG.objectFilter,
                        viewClass: 'contentWide',
                        label: i18n.TabFilter,
                        selectedBy: '#selectFilters'
                    }, {
                        name: CONFIG.reports,
                        view: '#' + CONFIG.reports,
                        viewClass: 'contentWide',
                        label: i18n.TabReports,
                        selectedBy: '#selectReports'
                    }]
            }, {
                name: 'about',
                view: '#about',
                viewClass: 'contentWide',
                label: i18n.IcoAbout,
                selectedBy: '#selectAbout'
            }]
    };
    self.init = function () {
        document.title = self.title = i18n.LblReader;
        window.addEventListener("hashchange", self.show);
        moduleManager.load(self.moduleTree, { done: self.login });
    };
    self.login = function () {
        console.info(self.title + " " + CONFIG.appVersion + " started!");
        self.me.login()
            .then(self.show, self.logout);
    };
    self.show = function () {
        var uP = getUrlParams(), v;
        if (!self.projects.selected
            || !self.projects.selected.isLoaded()
            || uP[CONFIG.keyProject] && uP[CONFIG.keyProject] != self.projects.selected.id
            || uP[CONFIG.keyImport] && uP[CONFIG.keyImport].length > 0)
            v = '#' + CONFIG.importAny;
        else
            v = '#' + (uP[CONFIG.keyView] || CONFIG.specifications);
        moduleManager.show({ view: v, urlParams: uP });
    };
    self.export = function () {
        if (self[CONFIG.projects].selected && self[CONFIG.projects].selected.isLoaded())
            self[CONFIG.projects].selected.chooseFormatAndExport();
        else
            message.show(i18n.MsgNoProjectLoaded, { severity: 'warning', duration: CONFIG.messageDisplayTimeShort });
    };
    self.logout = function () {
        self.me.logout();
        self.hide();
    };
    self.hide = function () {
    };
    self.init();
    return self;
}
