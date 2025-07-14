"use strict";
/*!	A simple module loader and object (singleton) factory.
    When all registered modules are ready, a callback function is executed to start or continue the application.
    Dependencies: jQuery 3.1 and later.
    (C)copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
class ViewControl {
    constructor() {
        this.list = [];
    }
    exists(v) {
        return LIB.indexBy(this.list, 'view', v) > -1;
    }
    add(v) {
        this.list.push(v);
        $(v.view).hide();
    }
    show(params) {
        if (typeof (params) != 'object')
            throw new Error("moduleManager.show() needs a parameter.");
        let v, s;
        this.list.forEach((le) => {
            v = $(le.view);
            s = $(le.selectedBy);
            if (params.view == le.view) {
                this.selected = le;
                s.addClass('active');
                v.show();
                if (typeof (params.content) == 'string') {
                    v.html(params.content);
                    return;
                }
                ;
                if (typeof (le.show) == 'function') {
                    params.forced = true;
                    le.show(params);
                    return;
                }
            }
            else {
                s.removeClass('active');
                v.hide();
                if (typeof (le.hide) == 'function') {
                    le.hide();
                    return;
                }
            }
        });
        if (typeof (doResize) == 'function') {
            doResize();
        }
    }
    hide(v) {
        if (typeof (v) == 'string' && this.exists(v)) {
            $(v).hide();
            return;
        }
        ;
        if (this.selected) {
            $(this.selected.view).hide();
            $(this.selected.selectedBy).removeClass('active');
            this.selected = undefined;
        }
        ;
    }
}
class Browser {
    constructor() {
        this.language = navigator.language;
        console.info("Browser Language is '" + this.language + "'.");
        this.supportsHtml5History = Boolean(window.history && window.history.pushState);
        if (!this.supportsHtml5History)
            console.info("Browser does not support HTML5 History");
        this.supportsFileAPI = Boolean(window.File && window.FileReader && window.FileList && window.Blob);
    }
    isIE() {
        return /MSIE |rv:11.0/i.test(navigator.userAgent);
    }
}
var app, browser, message, moduleManager = function () {
    var self = {};
    let callWhenReady, loadPath = './', pend = 0;
    self.init = (opts) => {
        browser = new Browser();
        if (browser.isIE()) {
            let txt = 'Stopping: The web-browser Internet Explorer is not supported.';
            console.error(txt);
            alert(txt);
            return;
        }
        ;
        if (opts && opts.path)
            loadPath = opts.path;
        self.registered = new Set();
        self.ready = new Set();
        let initL = ['bootstrap', 'font', 'types', 'standards', 'i18n', 'helper', "xSpecif", 'ioOntology'];
        if (CONFIG.convertMarkdown)
            initL.push('markdown');
        loadL(initL, { done: createApp });
        return;
        function createApp() {
            app = window['SpecifApp']();
            app.busy = new State({
                showWhenSet: ['#spinner'],
                hideWhenSet: ['.pageActions', '.contentActions']
            });
            window.onresize = doResize;
        }
        function loadL(L, opts) {
            if (opts && typeof (opts.done) == "function")
                callWhenReady = opts.done;
            else
                throw new Error("No callback provided to continue after initializing.");
            L.forEach((e) => { loadModule(e); });
        }
    };
    function register(mod) {
        if (self.registered.has(mod)) {
            console.warn("WARNING: Did not reload module '" + mod + "'.");
            return false;
        }
        ;
        self.registered.add(mod);
        return true;
    }
    self.load = (tr, opts) => {
        self.tree = tr;
        if (opts && typeof (opts.done) == "function")
            callWhenReady = opts.done;
        ld(tr);
        return;
        function ld(e) {
            if (e.view && e.parent) {
                let c = e.viewClass ? 'class="' + e.viewClass + '" ' : '', d = '<div id="' + e.view.substring(1) + '" ' + c + 'style="display:none;"></div>';
                $(e.parent.view).append(d);
            }
            ;
            if (e.name) {
                loadModule(e);
            }
            ;
            if (e.children) {
                loadChildren(e);
            }
            ;
            return;
            function loadChildren(e) {
                if (e.selector) {
                    e.viewControl = new ViewControl();
                    if ($(e.selector).length < 1) {
                        let s = '';
                        switch (e.selectorType) {
                            case 'btns':
                                s = '<div id="' + e.selector.substring(1) + '" class="btn-group" ></div>';
                                break;
                            default:
                                s = '<ul id="' + e.selector.substring(1) + '" role="tablist" class="nav nav-tabs"></ul>';
                        }
                        ;
                        $(e.view).append(s);
                    }
                    ;
                    let id = null, lbl = null;
                    e.children.forEach(function (ch) {
                        if (ch.view) {
                            if (!ch.selectedBy) {
                                throw new Error("Module '" + ch.name + "' must have both properties 'view' and 'selectedBy' or none.");
                            }
                            ;
                            e.viewControl.add(ch);
                            id = ch.selectedBy.substring(1);
                            lbl = ch.label || id;
                            switch (e.selectorType) {
                                case 'btns':
                                    $(e.selector).append('<button id="' + id + '" type="button" class="btn btn-light" onclick="moduleManager.show({view:\'' + ch.view + '\'})" >' + lbl + '</button>');
                                    break;
                                default:
                                    $(e.selector).append('<li class="nav-item"><button class="nav-link" id="' + id + '"type = "button" role="tab" onclick="moduleManager.show({view:\'' + ch.view + '\'})">' + lbl + '</button></li>');
                            }
                            ;
                        }
                        ;
                        if (ch.action) {
                            if (!ch.selectedBy) {
                                throw new Error("Module '" + ch.name + "' must have both properties 'action' and 'selectedBy' or none.");
                            }
                            ;
                            id = ch.selectedBy.substring(1);
                            lbl = ch.label || id;
                            switch (e.selectorType) {
                                case 'btns':
                                    $(e.selector).append('<button id="' + id + '" type="button" class="btn btn-light" onclick="' + ch.action + '" >' + lbl + '</button>');
                                    break;
                                default:
                                    throw new Error("Action'" + lbl + "' needs a parent selector of type 'btns'.");
                            }
                            ;
                        }
                        ;
                    });
                }
                ;
                e.children.forEach((c) => {
                    c.parent = e;
                    ld(c);
                });
            }
        }
    };
    self.construct = (defs, constructorFn) => {
        let mo = findModule(self.tree, defs.name ?? defs.view);
        if (!mo)
            throw new Error(defs.name ? "'" + defs.name + "' is not a defined module name" : "'" + defs.view + "' is not a defined view");
        Object.assign(mo, defs);
        if (!mo.loadAs)
            mo.loadAs = mo.name ?? mo.view.substring(1);
        constructorFn(mo);
        app[mo.loadAs] = mo;
        if (defs.name && self.registered.has(defs.name))
            setReady(defs.name);
    };
    self.show = (params) => {
        if (typeof (params) != 'object')
            throw new Error("Undefined target view.");
        let mo = findModule(self.tree, params.view);
        if (!mo || !mo.parent.viewControl)
            throw new Error("'" + params.view + "' is not a defined view");
        setViewFromRoot(mo, params);
        setViewToLeaf(mo, params);
        return;
        function setViewFromRoot(le, pars) {
            if (le.parent.selectedBy) {
                setViewFromRoot(le.parent, Object.assign({}, pars, { view: le.parent.view }));
            }
            ;
            le.parent.viewControl.show(pars);
        }
        function setViewToLeaf(le, pars) {
            function findDefault(vL) {
                for (var i = vL.length - 1; i > -1; i--) {
                    if (vL[i].isDefault)
                        return vL[i];
                }
                ;
                return vL[0];
            }
            if (le.viewControl && le.viewControl.list.length > 0) {
                let ch = findDefault(le.viewControl.list);
                le.viewControl.show(Object.assign({}, pars, { view: ch.view }));
                setViewToLeaf(ch, pars);
            }
        }
    };
    self.isRegistered = (mod) => {
        return self.registered.has(mod);
    };
    self.isReady = (mod) => {
        return self.ready.has(mod);
    };
    return self;
    function initModuleTree(h) {
        function it(e) {
            if (typeof (e.init) == 'function')
                e.init();
            if (e.children)
                e.children.forEach((c) => { it(c); });
        }
        if (h)
            it(h);
    }
    function findModule(tr, token) {
        let m = undefined;
        if (Array.isArray(tr)) {
            for (var i = tr.length - 1; !m && i > -1; i--) {
                m = find(tr[i]);
            }
            ;
        }
        else {
            m = find(tr);
        }
        ;
        return m;
        function find(e) {
            if (e.name == token || e.view == token)
                return e;
            if (e.children) {
                let m = findModule(e.children, token);
                if (m)
                    return m;
            }
        }
    }
    function loadModule(mod) {
        var module = typeof (mod) == 'string' ? { name: mod } : mod;
        if (register(module.name)) {
            loadAfterRequiredModules(module, ldM);
        }
        ;
        return;
        function ldM(mod) {
            pend++;
            switch (mod) {
                case "font":
                    getStyle("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css");
                    setReady(mod);
                    return true;
                case "bootstrap":
                    getStyle("https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/css/bootstrap.min.css");
                    getScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.6/dist/js/bootstrap.bundle.min.js");
                    return true;
                case "tree":
                    loadModule('helperTree');
                    getStyle("https://cdn.jsdelivr.net/npm/jqtree@1.8.10/jqtree.css");
                    getScript('https://cdn.jsdelivr.net/npm/jqtree@1.8.10/tree.jquery.js');
                    return true;
                case "fileSaver":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
                    return true;
                case "zip":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
                    return true;
                case "jsonSchema":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/ajv/4.11.8/ajv.min.js');
                    return true;
                case "excel":
                    getScript('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
                    return true;
                case "bpmnViewer":
                    getScript('https://unpkg.com/bpmn-js@17.9.2/dist/bpmn-viewer.production.min.js');
                    return true;
                case "graphViz":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.6/standalone/umd/vis-network.min.js');
                    return true;
                case "pouchDB":
                    getScript('https://cdn.jsdelivr.net/npm/pouchdb@9.0.0/dist/pouchdb.min.js');
                    return true;
                case "markdown":
                    getScript('https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js')
                        .done(() => { window.markdown = window.markdownit({ html: true, xhtmlOut: true, breaks: true, linkify: false }); });
                    return true;
                case "types":
                    getScript(loadPath + 'types/specif.types.js');
                    return true;
                case "i18n":
                    switch (browser.language.slice(0, 2)) {
                        case 'de':
                            getScript(loadPath + 'config/locales/iLaH-de.i18n.js');
                            break;
                        case 'fr':
                            getScript(loadPath + 'config/locales/iLaH-fr.i18n.js');
                            break;
                        default: getScript(loadPath + 'config/locales/iLaH-en.i18n.js');
                    }
                    ;
                    return true;
                case "helper":
                    getScript(loadPath + 'modules/helper.js')
                        .done(() => { message = new CMessage(); });
                    return true;
                case "standards":
                    getScript(loadPath + 'modules/standards.js');
                    return true;
                case 'ioOntology':
                    getScript(loadPath + 'modules/ioOntology.js');
                    return true;
                case "helperTree":
                    getScript(loadPath + 'modules/helperTree.js');
                    return true;
                case "xSpecif":
                    getScript(loadPath + 'modules/xSpecif.js');
                    return true;
                case "projects":
                    loadModule('fileSaver');
                    getScript(loadPath + 'modules/cache.mod.js');
                    return true;
                case "profileAnonymous":
                    getScript(loadPath + 'modules/profileAnonymous.mod.js');
                    return true;
                case 'toHtml':
                    getScript(loadPath + 'modules/specif2html.js');
                    return true;
                case 'toXhtml':
                    if (!self.isRegistered('makeXhtml'))
                        loadModule('makeXhtml');
                    getScript(loadPath + 'modules/specif2xhtml.js');
                    return true;
                case "toEpub":
                    if (!self.isRegistered('makeXhtml'))
                        loadModule('makeXhtml');
                    getScript(loadPath + 'assets/javascripts/toEpub.js');
                    return true;
                case "makeXhtml":
                    getScript(loadPath + 'assets/javascripts/makeXhtml.js');
                    return true;
                case "toOxml":
                    getScript(loadPath + 'assets/javascripts/toOxml.js');
                    return true;
                case "toTurtle":
                    getScript(loadPath + 'modules/specif2turtle.js');
                    return true;
                case 'bpmn2specif':
                    getScript(loadPath + 'assets/javascripts/BPMN2SpecIF.js');
                    return true;
                case 'archimate2specif':
                    getScript(loadPath + 'assets/javascripts/archimate2SpecIF.js');
                    return true;
                case "sysml2specif":
                    getScript(loadPath + 'modules/sysml2specif.js');
                    return true;
                case 'reqif2specif':
                    getScript(loadPath + 'assets/javascripts/reqif2specif.js');
                    return true;
                case 'vicinityGraph':
                    loadModule('graphViz');
                    getScript(loadPath + 'modules/graph.js');
                    return true;
                case "serverPouch":
                    loadModule('pouchDB');
                    getScript(loadPath + 'modules/serverPouch.mod.js');
                    return true;
                case 'sheet2reqif':
                case 'importAny':
                    loadModule('zip');
                    loadModule('jsonSchema');
                case "about":
                case 'ioSpecif':
                case 'ioDdpSchema':
                case 'ioReqif':
                case 'ioPig':
                    getScript(loadPath + 'modules/' + mod + '.mod.js');
                    return true;
                case 'ioXls':
                    loadModule('excel');
                    getScript(loadPath + 'modules/ioXls.mod.js');
                    return true;
                case 'ioBpmn':
                    loadModule('bpmnViewer');
                    loadModule('bpmn2specif');
                    getScript(loadPath + 'modules/ioBpmn.mod.js');
                    return true;
                case 'ioArchimate':
                    loadModule('archimate2specif');
                    getScript(loadPath + 'modules/ioArchimate.mod.js');
                    return true;
                case 'ioSysml':
                    loadModule('sysml2specif');
                    getScript(loadPath + 'modules/ioSysml.mod.js');
                    return true;
                case CONFIG.specifications:
                    loadModule('tree');
                    getScript(loadPath + 'modules/specifications.mod.js');
                    return true;
                case CONFIG.reports:
                    getScript(loadPath + 'modules/reports.mod.js');
                    return true;
                case CONFIG.objectFilter:
                    getScript(loadPath + 'modules/filter.mod.js');
                    return true;
                case CONFIG.resourceEdit:
                    getScript(loadPath + 'modules/resourceEdit.mod.js');
                    return true;
                case CONFIG.resourceLink:
                    getScript(loadPath + 'modules/resourceLink.mod.js');
                    return true;
                default:
                    console.warn("Module loader: Module '" + mod + "' is unknown.");
                    return false;
            }
        }
        function getScript(url, options) {
            let settings = Object.assign(options ?? {}, {
                dataType: "script",
                cache: true,
                url: bust(url)
            });
            if (url.indexOf('.mod.') > 0)
                return $.ajax(settings);
            else
                return $.ajax(settings)
                    .done(() => { setReady(module.name); });
        }
        function loadAfterRequiredModules(mod, fn) {
            if ((!Array.isArray(mod.requires) || new Set(mod.requires).isSubsetOf(self.ready))
                && pend < 9)
                fn(mod.name);
            else
                setTimeout(function () { loadAfterRequiredModules(mod, fn); }, 33);
        }
    }
    function bust(url) {
        return url + (url.startsWith(loadPath) ? "?" + CONFIG.appVersion : "");
    }
    function getStyle(url) {
        $('head').append('<link rel="stylesheet" type="text/css" href="' + bust(url) + '" />');
    }
    function setReady(mod) {
        if (self.ready.has(mod))
            throw new Error("Module '" + mod + "' cannot be set 'ready' more than once");
        else {
            pend--;
            self.ready.add(mod);
            console.info("Loaded module '" + mod + "' (" + self.ready.length + " of " + self.registered.size + ").");
        }
        ;
        if (self.registered.size === self.ready.size) {
            if (self.tree) {
                getStyle(loadPath + 'assets/stylesheets/SpecIF.default.css');
                initModuleTree(self.tree);
                console.info("All " + self.ready.size + " modules loaded --> ready!");
            }
            else
                console.info("Initialization completed!");
            if (typeof (callWhenReady) == 'function')
                callWhenReady();
            else
                throw new Error("No callback provided to continue after module loading.");
        }
        ;
    }
}();
class State {
    constructor(opts) {
        this.state = false;
        this.showWhenSet = Array.isArray(opts.showWhenSet) ? opts.showWhenSet : [];
        this.hideWhenSet = Array.isArray(opts.hideWhenSet) ? opts.hideWhenSet : [];
    }
    set(flag) {
        switch (flag) {
            case false:
                this.reset();
                break;
            case undefined:
            case true:
                this.state = true;
                this.hideWhenSet.forEach((v) => {
                    $(v).hide();
                });
                this.showWhenSet.forEach((v) => {
                    $(v).show();
                });
        }
        ;
    }
    reset() {
        this.state = false;
        this.showWhenSet.forEach((v) => {
            $(v).hide();
        });
        this.hideWhenSet.forEach((v) => {
            $(v).show();
        });
    }
    get() {
        return this.state;
    }
}
function doResize() {
    let wH = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight, hH = LIB.getHeight('#pageHeader') + LIB.getHeight('.nav-tabs'), pH = wH - hH;
    $('.content').outerHeight(pH);
    $('.contentWide').outerHeight(pH);
    $('.pane-tree').css('max-height', pH);
    $('.pane-details').css('max-height', pH);
    $('#aboutFrame').outerHeight(pH - 8);
}
