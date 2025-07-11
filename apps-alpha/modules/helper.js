"use strict";
const LIB = {};
function popOver(dsc) {
    return (dsc ? (' data-toggle="popover" title="' + LIB.displayValueOf(dsc, { targetLanguage: browser.language, stripHTML: true }) + '" ') : '');
}
function makeTextField(tag, val, opts) {
    if (!opts)
        opts = {};
    if (typeof (opts.tagPos) != 'string')
        opts.tagPos = 'left';
    let tagCols;
    if (typeof (opts.tagCols) == 'number')
        tagCols = 'col-' + opts.tagCols;
    else
        tagCols = 'col-3';
    let fn = (typeof (opts.handle) == 'string' && opts.handle.length > 0) ? ' oninput="' + opts.handle + '"' : '', sH = simpleHash(tag), fG, cl = (typeof (opts.classes) == 'string' && opts.classes.length > 0) ? ' ' + opts.classes : '', aC;
    if (opts.typ && ['line', 'area', 'outer'].includes(opts.typ))
        fG = '<div id="' + sH + '" class="row attribute form-active' + cl + '" >';
    else
        fG = '<div class="row attribute' + cl + '" >';
    switch (opts.tagPos) {
        case 'none':
            aC = 'col-12';
            break;
        case 'left':
            fG += '<div class="' + tagCols + ' attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>';
            aC = 'col attribute-value';
            break;
        default:
            throw Error("Invalid display option '" + opts.tagPos + "' when showing a text form");
    }
    ;
    if (opts.typ && !['outer'].includes(opts.typ))
        val = LIB.noCode(val || '');
    switch (opts.typ) {
        case 'line':
            fG += '<div class="' + aC + '">'
                + (val.includes('\n') ?
                    '<textarea id="field' + sH + '" class="form-control" rows="2"' + fn + '>' + val + '</textarea>'
                    : '<input type="text" id="field' + sH + '" class="form-control"' + fn + ' value="' + val + '" />')
                + '</div>';
            break;
        case 'area':
            fG += '<div class="' + aC + '">'
                + '<textarea id="field' + sH + '" class="form-control" rows="7"' + fn + '>' + val + '</textarea>'
                + '</div>';
            break;
        case 'outer':
            fG += '<div class="' + aC + '">'
                + val
                + '</div>';
            break;
        default:
            fG += '<div id="field' + sH + '" class="' + aC + '" >' + val + '</div>';
    }
    ;
    fG += '</div>';
    return fG;
}
function setTextValue(tag, val) {
    val = LIB.noCode(val || '');
    let el = document.getElementById('field' + simpleHash(tag));
    if (el && el.nodeName && el.nodeName.toLowerCase() == 'div') {
        el.innerHTML = val;
        return;
    }
    ;
    if (el)
        el.value = val;
}
function setFocus(tag) {
    let el = document.getElementById('field' + simpleHash(tag));
    if (el)
        el.focus();
}
function setTextState(tag, state) {
    if (['is-valid', 'is-invalid'].indexOf(state) < 0)
        throw Error("Invalid state '" + state + "'");
    let el = $('#field' + simpleHash(tag));
    if (!el)
        return false;
    if (el.hasClass('is-invalid')) {
        if (state == 'is-valid') {
            el.removeClass('is-invalid').addClass('is-valid');
            return true;
        }
        else
            return false;
    }
    ;
    if (el.hasClass('is-valid')) {
        if (state == 'is-invalid') {
            el.removeClass('is-valid').addClass('is-invalid');
            return true;
        }
        else
            return false;
    }
    ;
    el.addClass(state);
    return true;
}
function textValue(tag) {
    try {
        return LIB.noCode(document.getElementById('field' + simpleHash(tag)).value).escapeJSON() || '';
    }
    catch (e) {
        return '';
    }
}
function getTextLength(tag) {
    try {
        return textValue(tag).length;
    }
    catch (e) {
        return -1;
    }
}
function makeSelectionField(tag, entries, opts) {
    if (!opts || !opts.kind || !['radio', 'checkbox'].includes(opts.kind))
        throw Error("Kind of selection field must be either 'radio' or 'checkbox'");
    switch (opts.typ) {
        case 'display':
            return '<div class="row attribute ' + (opts.classes || '') + '">'
                + '<div class="col-3 attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="col attribute-value" >'
                + function () {
                    let vals = '';
                    entries.forEach((e) => {
                        vals += (e.checked ? (vals.length > 0 ? ', ' : '') + e.title : '');
                    });
                    return vals;
                }()
                + '</div>'
                + '</div>';
    }
    ;
    if (typeof (opts.tagPos) != 'string')
        opts.tagPos = 'left';
    if (typeof (opts.classes) != 'string')
        opts.classes = 'form-active';
    let rB = '<div class="row attribute ' + (opts.classes || '') + '">', fn = (typeof (opts.handle) == 'string' && opts.handle.length > 0) ? ' onclick="' + opts.handle + '"' : '';
    switch (opts.tagPos) {
        case 'none':
            rB += '<div class="' + opts.kind + '" >';
            break;
        case 'left':
            rB += '<div class="col-3 attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="col attribute-value ' + opts.kind + '" >';
            break;
        default:
            throw Error("Invalid display option '" + opts.tagPos + "' when showing a '" + opts.kind + "' form");
    }
    ;
    if (opts.kind == 'radio') {
        let found = false, temp;
        entries.forEach((e) => {
            temp = found || !!e.checked;
            if (found && e.checked)
                e.checked = false;
            found = temp;
        });
    }
    ;
    entries.forEach((e, i) => {
        rB += '<label>'
            + '<input type="' + opts.kind + '" name="' + opts.kind + '' + simpleHash(tag) + '" value="' + (e.id || i) + '"' + (e.checked ? ' checked' : '') + fn + ' />'
            + '<span ' + popOver(e.description) + '>'
            + '&#160;' + e.title
            + (e.type ? '&#160;(' + e.type + ')' : '')
            + '</span>'
            + '</label><br />';
    });
    rB += '</div>'
        + '</div>';
    return rB;
}
function makeRadioField(tag, entries, opts) {
    if (!opts)
        opts = {};
    opts.kind = 'radio';
    return makeSelectionField(tag, entries, opts);
}
function radioValue(tag) {
    return $('input[name="radio' + simpleHash(tag) + '"]:checked').attr('value') || '';
}
function makeCheckboxField(tag, entries, opts) {
    if (!opts)
        opts = {};
    opts.kind = 'checkbox';
    return makeSelectionField(tag, entries, opts);
}
function checkboxValues(tag) {
    let chd = $('input[name="checkbox' + simpleHash(tag) + '"]:checked');
    var resL = [];
    Array.from(chd, (el) => {
        resL.push(el.value);
    });
    return resL;
}
function makeBooleanField(tag, val, opts) {
    if (!opts)
        opts = {};
    let fn = '';
    if (typeof (opts.handle) == 'string' && opts.handle.length > 0)
        fn = ' onclick="' + opts.handle + '"';
    switch (opts.typ) {
        case 'display':
            return '<div class="row attribute">'
                + '<div class="col-3 attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="col attribute-value">' + (val ? 'true' : 'false') + '</div>'
                + '</div>';
        default:
            return '<div class="row attribute form-active">'
                + '<div class="col-3 attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="col attribute-value checkbox" >'
                + '<label>'
                + '<input type="checkbox" name="boolean' + simpleHash(tag) + '"' + (val ? ' checked' : '') + fn + ' />'
                + '</label><br />'
                + '</div>'
                + '</div>';
    }
}
function booleanValue(tag) {
    let chd = $('input[name="boolean' + simpleHash(tag) + '"]:checked');
    return chd.length > 0;
}
function tagId(str) {
    return 'X-' + simpleHash(str || '');
}
class CCheckDialogInput {
    constructor() {
        this.list = [];
    }
    addField(elementId, dT, opts) {
        this.list.push({ label: elementId, dataType: dT, options: opts });
    }
    ;
    check() {
        let val, ok = true, allOk = true, notReq = true;
        this.list.forEach((cPs) => {
            notReq = !(cPs.options && cPs.options.required);
            val = textValue(cPs.label);
            switch (cPs.dataType.type) {
                case XsDataType.String:
                    ok = (cPs.dataType.maxLength == undefined) || (val.length <= cPs.dataType.maxLength);
                    break;
                case XsDataType.Double:
                    ok = notReq && (val.length < 1)
                        || RE.Real(cPs.dataType.fractionDigits).test(val)
                            && !(typeof (cPs.dataType.minInclusive) == 'number' && parseFloat(val) < cPs.dataType.minInclusive)
                            && !(typeof (cPs.dataType.maxInclusive) == 'number' && parseFloat(val) > cPs.dataType.maxInclusive);
                    break;
                case XsDataType.Integer:
                    ok = notReq && (val.length < 1)
                        || RE.Integer.test(val)
                            && !(typeof (cPs.dataType.minInclusive) == 'number' && parseFloat(val) < cPs.dataType.minInclusive)
                            && !(typeof (cPs.dataType.maxInclusive) == 'number' && parseFloat(val) > cPs.dataType.maxInclusive);
                    break;
                case XsDataType.DateTime:
                    ok = notReq && (val.length < 1) || LIB.isIsoDateTime(val);
                    break;
                case XsDataType.AnyURI:
                    RE.URI.test('');
                    ok = notReq && (val.length < 1) || RE.URI.test(val);
                    break;
                default:
                    ok = true;
            }
            ;
            setTextState(cPs.label, ok ? 'is-valid' : 'is-invalid');
            allOk = allOk && ok;
        });
        return allOk;
    }
}
class resultMsg {
    constructor(st, sTxt, rTyp, resp) {
        this.status = st;
        this.statusText = sTxt;
        this.responseType = rTyp;
        this.response = resp;
    }
    ok() {
        return ["0", "200", "201"].includes(this.status.toString());
    }
    asString() {
        return this.statusText + " (" + this.status + (this.responseType == 'text' ? "): " + (this.response || this.responseText) : ")");
    }
    log() {
        console.log(this.asString());
        return this;
    }
    warn() {
        console.warn(this.asString());
        return this;
    }
}
LIB.stdError = (xhr, cb) => {
    let xhrCl = new resultMsg(xhr.status, xhr.statusText, xhr.responseType, xhr.responseType == 'text' ? (xhr.response || xhr.responseText) : '');
    switch (xhr.status) {
        case 0:
        case 200:
        case 201:
            return;
        case 401:
            app.me.logout();
            break;
        case 402:
            xhrCl.responseType = 'text';
            xhrCl.response = i18n.Err402InsufficientLicense;
            message.show(xhrCl);
            break;
        case 403:
            xhrCl.responseType = 'text';
            xhrCl.response = i18n.Err403Forbidden;
            message.show(xhrCl);
            break;
        case 404:
            xhrCl.responseType = 'text';
            xhrCl.response = typeof (xhrCl.response) == 'string' && xhrCl.response.length > 0 ? xhrCl.response : i18n.Err404NotFound;
            message.show(xhrCl);
            break;
        default:
            message.show(xhr);
    }
    ;
    xhrCl.log();
    if (typeof (cb) == 'function')
        cb();
};
class CMessage {
    constructor() {
        this.pend = 0;
        $('#app').prepend('<div id="message" ></div>');
    }
    hide() {
        $('#message')
            .empty()
            .hide();
        this.pend = 0;
    }
    remove() {
        if (--this.pend < 1)
            this.hide();
    }
    show(msg, opts) {
        if (!opts)
            opts = {};
        switch (typeof (msg)) {
            case 'string':
                if (msg.length > 0)
                    break;
                this.hide();
                return;
            case 'object':
                if (msg.status) {
                    if (!opts.severity)
                        opts.severity = msg.status < 202 ? 'success' : 'danger';
                    msg = (msg.statusText || i18n.Error)
                        + " (" + msg.status
                        + (msg.responseType == 'text' ? "): " + (msg.response || msg.responseText) : ")");
                    break;
                }
                ;
            default:
                console.error(msg, ' is an invalid message.');
                return;
        }
        ;
        if (!opts.severity || ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'danger'].indexOf(opts.severity) < 0)
            opts.severity = 'warning';
        if (opts.severity == 'error')
            opts.severity = 'danger';
        if (!opts.duration || typeof (opts.duration) != 'number')
            opts.duration = CONFIG.messageDisplayTimeNormal;
        $('#message')
            .html('<div class="alert alert-' + opts.severity + '" role="alert" >' + msg + '</div>')
            .show();
        if (opts.duration > 10) {
            this.pend++;
            setTimeout(() => { this.remove(); }, opts.duration);
        }
    }
}
;
LIB.isKey = (el) => {
    return typeof (el) == 'object' && el.id;
};
LIB.keyOf = (itm) => {
    return itm.revision ? { id: itm.id, revision: itm.revision } : { id: itm.id };
};
LIB.makeKey = (el) => {
    return el ? (typeof (el) == 'string' ? { id: el } : LIB.keyOf(el)) : undefined;
};
LIB.replacePrefix = (newPrefix, id) => {
    return id.replace(RE.isolatePrefix, (match, $1, $2) => {
        return newPrefix + $2;
    });
};
LIB.containsAllKeys = (refL, newL) => {
    if (Array.isArray(refL) && Array.isArray(newL)) {
        if (refL.length < newL.length)
            return false;
        for (var nE of newL)
            if (LIB.indexByKey(refL, nE) < 0)
                return false;
        return true;
    }
    ;
    throw Error("Both input parameters must be an array.");
};
LIB.equalKey = (refE, newE) => {
    return refE.id == newE.id && refE.revision == newE.revision;
};
LIB.equalKeyL = (refL, newL) => {
    let rArr = Array.isArray(refL) && refL.length > 0, nArr = Array.isArray(newL) && newL.length > 0;
    if (!rArr && !nArr)
        return true;
    if (!rArr && nArr
        || rArr && !nArr
        || refL.length != newL.length)
        return false;
    return LIB.containsAllKeys(refL, newL);
};
LIB.equalValue = (refV, newV) => {
    if (typeof (refV) != typeof (newV))
        return false;
    if (LIB.isString(refV))
        return refV == newV;
    if (LIB.isMultiLanguageValue(refV))
        return refV.text == newV.text && refV.language == newV.language && refV.format == newV.format;
    return false;
};
LIB.equalValues = (refVL, newVL) => {
    if (refVL.length != newVL.length)
        return false;
    for (var i = newVL.length - 1; i > -1; i--)
        if (!LIB.equalValue(refVL[i], newVL[i]))
            return false;
    return true;
};
LIB.equalBoolean = (rB, nB) => {
    return (rB && nB || !rB && !nB);
};
LIB.equalDT = (refE, newE) => {
    if (refE.type != newE.type)
        return false;
    switch (refE.type) {
        case XsDataType.Double:
            if (refE.fractionDigits != newE.fractionDigits)
                return false;
        case XsDataType.Integer:
            if (refE.minInclusive != newE.minInclusive || refE.maxInclusive != newE.maxInclusive)
                return false;
            break;
        case XsDataType.String:
            if (refE.maxLength != newE.maxLength)
                return false;
    }
    ;
    if (!Array.isArray(refE.enumeration) && !Array.isArray(newE.enumeration))
        return true;
    if (Array.isArray(refE.enumeration) != Array.isArray(newE.enumeration)
        || refE.enumeration.length != newE.enumeration.length)
        return false;
    for (var i = newE.enumeration.length - 1; i > -1; i--) {
        if (LIB.indexById(refE.enumeration, newE.enumeration[i].id) < 0)
            return false;
    }
    ;
    return true;
};
LIB.equalPC = (refE, newE) => {
    if (Array.isArray(refE.values) != Array.isArray(newE.values))
        return false;
    return refE.title == newE.title
        && LIB.equalKey(refE.dataType, newE.dataType)
        && (!Array.isArray(refE.values) && !Array.isArray(newE.values)
            || LIB.equalValues(refE.values, newE.values))
        && LIB.equalBoolean(refE.multiple, newE.multiple);
};
LIB.equalRC = (refE, newE) => {
    return refE.title == newE.title
        && LIB.equalBoolean(refE.isHeading, newE.isHeading)
        && LIB.equalKeyL(refE.propertyClasses, newE.propertyClasses);
};
LIB.equalSC = (refE, newE) => {
    return refE.title == newE.title
        && LIB.equalKeyL(refE.propertyClasses, newE.propertyClasses)
        && eqSCL(refE.subjectClasses, newE.subjectClasses)
        && eqSCL(refE.objectClasses, newE.objectClasses)
        && LIB.isEqualStringL(refE.instantiation, newE.instantiation);
    function eqSCL(rL, nL) {
        if (!Array.isArray(nL))
            return true;
        return LIB.equalKeyL(rL, nL);
    }
};
LIB.isString = (el) => {
    return typeof (el) == 'string';
};
LIB.isIsoDateTime = (val) => {
    return RE.IsoDateTime.test(val);
};
LIB.isEqualStringL = (refL, newL) => {
    let rArr = Array.isArray(refL) && refL.length > 0, nArr = Array.isArray(newL) && newL.length > 0;
    if (!rArr && !nArr)
        return true;
    if (!rArr && nArr
        || rArr && !nArr
        || refL.length != newL.length)
        return false;
    for (var lE of refL)
        if (newL.indexOf(lE) < 0)
            return false;
    return true;
};
LIB.useRemotePath = () => {
    return window.location.href.startsWith('http') || window.location.href.endsWith('.specif.html');
};
LIB.versionOf = (spD) => {
    return spD.specifVersion || RE.versionFromPath.exec(spD['$schema'])[1];
};
LIB.hasContent = (pV) => {
    if (typeof (pV) != "string"
        || /^.{0,2}(?:no entry|empty).{0,2}$/.test(pV.toLowerCase()))
        return false;
    return pV.stripHTML().length > 0
        || RE.tagSingleObject.test(pV)
        || RE.tagImg.test(pV)
        || RE.tagA.test(pV);
};
LIB.isMultiLanguageValue = (L) => {
    if (Array.isArray(L)) {
        let hasMultipleLanguages = L.length > 1;
        for (var i = L.length - 1; i > -1; i--) {
            let lE = L[i];
            if (typeof (lE["text"]) != "string" || (hasMultipleLanguages && i > 0 && (typeof (lE.language) != "string" || lE.language.length < 2)))
                return false;
        }
        ;
        return true;
    }
    ;
    return false;
};
LIB.multiLanguageValueHasContent = (L) => {
    return L && L.length > 0 && LIB.isMultiLanguageValue(L) && LIB.hasContent(L[0]["text"]);
};
LIB.makeMultiLanguageValue = (el, opts) => {
    if (typeof (el) == 'string') {
        return opts && opts.language ? [{ text: el, language: opts.language }] : [{ text: el }];
    }
    ;
    return LIB.isMultiLanguageValue(el) ? el : undefined;
};
LIB.languageValueOf = (val, opts) => {
    if (!LIB.isMultiLanguageValue(val)) {
        console.error("Value must be a multi-language text: ", val);
        throw Error("Programming Error: Value must be a multi-language text.");
    }
    ;
    if (val.length < 1)
        return;
    let lVs = val.filter((v) => {
        return v.language && opts && opts.targetLanguage.toLowerCase() == v.language.toLowerCase();
    });
    if (lVs.length > 0)
        return lVs[0];
    lVs = val.filter((v) => {
        return v.language && opts && opts.targetLanguage && opts.targetLanguage.slice(0, 2).toLowerCase() == v.language.slice(0, 2).toLowerCase();
    });
    if (lVs.length > 0)
        return lVs[0];
    if (opts && opts.dontReturnDefaultValue)
        return;
    return val[0];
};
LIB.languageTextOf = (val, opts) => {
    if (!opts || !opts.targetLanguage)
        return val;
    let langV = LIB.languageValueOf(val, opts);
    return (langV ? langV['text'] : '');
};
LIB.selectTargetLanguage = (val, opts) => {
    return LIB.makeMultiLanguageValue(LIB.languageTextOf(val, opts), opts);
};
LIB.lookupEnums = (p, dta, opts) => {
    if (opts && opts.lookupEnums) {
        let pC = LIB.itemByKey(dta.propertyClasses, p['class']), dT = LIB.itemByKey(dta.dataTypes, pC.dataType);
        if (dT.enumeration)
            p.values = p.values.map((v) => LIB.itemById(dT.enumeration, v.id).value);
    }
    ;
    return p;
};
LIB.displayValueOf = (val, opts) => {
    function lookup(v) {
        if (opts && opts.lookupValues)
            v = app.ontology.localize(v, opts);
        return opts && opts.stripHTML ? v.stripHTML() : v;
    }
    if (!opts)
        opts = { targetLanguage: 'default' };
    else if (!opts.targetLanguage)
        opts.targetLanguage = 'default';
    if (LIB.isMultiLanguageValue(val)) {
        return lookup(LIB.languageTextOf(val, opts));
    }
    ;
    return val;
};
LIB.propertyByTitle = (itm, pN, dta) => {
    if (itm) {
        if (itm.properties) {
            let pC;
            for (var p of itm.properties) {
                pC = LIB.itemByKey(dta.propertyClasses, p['class']);
                if (pC && pC.title == pN)
                    return p;
            }
        }
        ;
    }
    ;
};
LIB.updatePropertyByTitle = (itm, pN, fn, dta) => {
    let prp = LIB.propertyByTitle(itm, pN, dta), ti = fn();
    if (ti)
        prp.values = ti;
};
LIB.valuesByTitle = (itm, pNs, dta) => {
    if (itm) {
        let valL = [];
        if (itm.properties) {
            let dT, pC;
            for (var p of itm.properties) {
                pC = LIB.itemByKey(dta.propertyClasses, p['class']);
                for (var pN of pNs) {
                    if (pC && pC.title == pN) {
                        dT = LIB.itemByKey(dta.dataTypes, pC.dataType);
                        if (dT) {
                            valL = valL.concat(dT.enumeration ?
                                p.values.map((v) => { return LIB.itemById(dT.enumeration, v.id).value; })
                                : p.values);
                        }
                    }
                }
            }
        }
        ;
        return valL;
    }
    ;
};
LIB.valueByTitle = (el, ti, dta, opts) => {
    if (el) {
        let pVL = LIB.valuesByTitle(el, [ti], dta);
        if (pVL.length > 1)
            console.warn("Multiple values for property with title '" + ti + "' found in " + el.id + ". Only the first one is returned.");
        return pVL.length > 0 ? LIB.displayValueOf(pVL[0], opts) : undefined;
    }
    ;
};
LIB.enumeratedValuesOf = (dTk, dta) => {
    var dT = dTk.type ? dTk : LIB.itemByKey((dta ? dta.dataTypes : app.projects.selected.cache.get('dataType', app.projects.selected.dataTypes)), dTk), oL = [];
    if (dT.enumeration)
        for (var v of dT.enumeration) {
            oL.push(LIB.languageTextOf(v.value, { targetLanguage: 'default' }));
        }
    ;
    return oL;
};
LIB.mostRecent = (L, k) => {
    return L[LIB.indexByKey(L, { id: k.id })];
};
LIB.duplicateId = (dta, id) => {
    if (dta.id == id)
        return true;
    for (var i in dta) {
        if (Array.isArray(dta[i])) {
            for (var j = dta[i].length - 1; j > -1; j--) {
                if (LIB.duplicateId(dta[i][j], id))
                    return true;
            }
            ;
        }
        ;
    }
    ;
    return false;
};
LIB.indexBy = (L, p, k) => {
    if (L && p && k) {
        for (var i = L.length - 1; i > -1; i--)
            if (LIB.isKey(k) ? LIB.references(k, L[i][p]) : L[i][p] == k)
                return i;
    }
    ;
    return -1;
};
LIB.itemBy = (L, p, k) => {
    if (L && p && k) {
        for (var l of L)
            if (LIB.isKey(k) ? LIB.references(k, l[p]) : l[p] == k)
                return l;
    }
    ;
};
LIB.indexById = (L, id) => {
    if (L && id) {
        id = id.trim();
        for (var i = L.length - 1; i > -1; i--)
            if (L[i].id == id)
                return i;
    }
    ;
    return -1;
};
LIB.itemById = (L, id) => {
    if (L && id) {
        id = id.trim();
        for (var i = L.length - 1; i > -1; i--)
            if (L[i].id == id)
                return L[i];
    }
};
LIB.itemByTitle = (L, ti) => {
    if (L && ti) {
        for (var l of L)
            if (l.title == ti)
                return l;
    }
};
LIB.indexByKey = (L, k) => {
    let itemsWithEqId = LIB.forAll(L, (e, i) => {
        if (e.id == k.id)
            return { idx: i, rev: e.revision, chAt: e.changedAt };
    });
    if (itemsWithEqId.length < 1)
        return -1;
    if (itemsWithEqId.length == 1) {
        if (!k.revision || itemsWithEqId[0].rev == k.revision)
            return itemsWithEqId[0].idx;
        else
            return -1;
    }
    ;
    for (let itm of itemsWithEqId) {
        if (!itm.rev)
            console.error("Item with id '" + k.id + "' occurs more than once, where at least one does not have a specified revision.");
    }
    ;
    if (k.revision) {
        let itemsWithEqRev = itemsWithEqId.filter((e) => { return e.rev == k.revision; });
        if (itemsWithEqRev.length < 1)
            return -1;
        if (itemsWithEqRev.length == 1)
            return itemsWithEqRev[0].idx;
        throw Error("There are >1 items with the same id '" + k.id + "' and revision '" + k.revision + "'.");
    }
    else {
        let itemsNotReplaced = itemsWithEqId.filter((i) => {
            for (let itm of itemsWithEqId) {
                if (Array.isArray(L[itm.idx].replaces) && L[itm.idx].replaces.includes(i.rev))
                    return false;
            }
            return true;
        });
        if (itemsNotReplaced.length == 1)
            return itemsNotReplaced[0].idx;
        if (itemsNotReplaced.length < 1)
            throw Error("There is a cyclic reference within " + JSON.stringify(L) + "'.");
        console.info("There are multiple branches; no item returned for " + JSON.stringify(k) + ".");
        return -1;
    }
    ;
};
LIB.itemByKey = (L, k) => {
    let i = LIB.indexByKey(L, k);
    if (i > -1)
        return L[i];
};
LIB.references = (n, k) => {
    return LIB.isKey(k) && LIB.isKey(n) && k.id == n.id && (!n.revision || k.revision == n.revision);
};
LIB.referenceIndex = (L, k) => {
    for (var i = L.length - 1; i > -1; i--)
        if (LIB.references(L[i], k))
            return i;
    return -1;
};
LIB.referenceIndexBy = (L, p, k) => {
    if (L && p && k) {
        for (var i = L.length - 1; i > -1; i--)
            if (LIB.references(L[i][p], k))
                return i;
    }
    ;
    return -1;
};
LIB.referenceItemBy = (L, p, k) => {
    let i = LIB.referenceIndexBy(L, p, k);
    if (i > -1)
        return L[i];
};
LIB.containsById = (cL, L) => {
    if (!cL || !L)
        throw Error("Missing Input Parameter");
    return Array.isArray(L) ? containsL(cL, L) : LIB.indexById(cL, L.id) > -1;
    function containsL(cL, L) {
        for (var i = L.length - 1; i > -1; i--)
            if (LIB.indexById(cL, L[i].id) < 0)
                return false;
        return true;
    }
};
LIB.containsAllStrings = (refL, newL) => {
    for (var i = newL.length - 1; i > -1; i--)
        if (refL.indexOf(newL[i]) < 0)
            return false;
    return true;
};
LIB.addPCReference = (eC, key) => {
    if (Array.isArray(eC.propertyClasses)) {
        if (LIB.indexById(eC.propertyClasses, key.id) < 0
            || LIB.indexByKey(eC.propertyClasses, key) < 0)
            eC.propertyClasses.unshift(key);
    }
    else {
        eC.propertyClasses = [key];
    }
};
LIB.addProperty = (el, prp) => {
    if (Array.isArray(el.properties))
        el.properties.unshift(prp);
    else
        el.properties = [prp];
};
LIB.addClassesTo = (term, dta) => {
    let items = app.ontology.generateSpecifClasses({ terms: [term], delta: true, referencesWithoutRevision: true }), item;
    for (var Ln of ['dataTypes', 'propertyClasses', 'resourceClasses', 'statementClasses']) {
        LIB.cacheL(dta[Ln], items[Ln]);
        let idx = LIB.indexBy(dta[Ln], 'title', term);
        if (idx > -1)
            item = dta[Ln][idx];
    }
    ;
    if (!item)
        console.error('No class found for term ' + term + '.');
    return item;
};
LIB.getExtendedClasses = (cL, toGet) => {
    if (toGet == 'all')
        toGet = cL.map(c => LIB.keyOf(c));
    let resL = [];
    for (var clk of toGet) {
        resL.push(extendClass(clk));
    }
    ;
    return resL;
    function getClassWithParents(L, clK) {
        let resL = [], cK = simpleClone(clK);
        do {
            let c = LIB.itemByKey(L, cK);
            if (c) {
                cK = c['extends'];
                resL.unshift(c);
            }
            else {
                throw Error('Did not find extending class ' + cK.id);
            }
            ;
        } while (cK);
        return resL;
    }
    function extendClass(k) {
        let rC = {};
        getClassWithParents(cL, k)
            .forEach((c) => {
            for (let att in c) {
                if (["propertyClasses"].includes(att)) {
                    if (Array.isArray(c[att])) {
                        if (Array.isArray(rC[att]))
                            LIB.cacheL(rC[att], c[att]);
                        else
                            rC[att] = simpleClone(c[att]);
                    }
                    ;
                }
                else
                    rC[att] = simpleClone(c[att]);
            }
            ;
        });
        delete rC['extends'];
        return rC;
    }
};
LIB.keepUsedClasses = (spD) => {
    spD.statementClasses = keepUsed(spD.statementClasses, spD.statements, spD.statementClasses);
    spD.resourceClasses = keepUsed(spD.resourceClasses, spD.resources, spD.statementClasses);
    spD.propertyClasses = keepUsedPC(spD.propertyClasses, spD.statementClasses.concat(spD.resourceClasses));
    spD.dataTypes = keepUsedDT(spD.dataTypes, spD.propertyClasses);
    return spD;
    function keepUsedDT(cL, iL) {
        let prevLength;
        do {
            prevLength = cL.length;
            cL = cL.filter((c) => {
                for (let i of iL) {
                    if (LIB.references(i.dataType, c))
                        return true;
                }
                ;
                console.info("Deleting unused ", c.id);
            });
        } while (prevLength > cL.length);
        return cL;
    }
    function keepUsedPC(cL, iL) {
        let prevLength;
        do {
            prevLength = cL.length;
            cL = cL.filter((c) => {
                if (c.keepEvenIfUnused)
                    return true;
                for (let i of iL) {
                    if (Array.isArray(i.propertyClasses))
                        for (let p of i.propertyClasses)
                            if (LIB.references(p, c))
                                return true;
                }
                ;
                console.info("Deleting unused ", c.id);
            });
        } while (prevLength > cL.length);
        return cL;
    }
    function keepUsed(cL, iL, sCL) {
        let prevLength;
        do {
            prevLength = cL.length;
            cL = cL.filter((c) => {
                if (c.keepEvenIfUnused)
                    return true;
                for (let c1 of cL)
                    if (LIB.references(c1.extends, c))
                        return true;
                for (let i of iL) {
                    if (LIB.references(i['class'], c))
                        return true;
                }
                ;
                for (let sC of sCL) {
                    if (sC.subjectClasses)
                        for (let sbjC of sC.subjectClasses)
                            if (LIB.references(sbjC, c))
                                return true;
                    if (sC.objectClasses)
                        for (let objC of sC.objectClasses)
                            if (LIB.references(objC, c))
                                return true;
                }
                ;
                console.info("Deleting unused ", c.id);
            });
        } while (prevLength > cL.length);
        return cL;
    }
};
LIB.cmp = (i, a) => {
    if (!i)
        return -1;
    if (!a)
        return 1;
    i = i.toLowerCase();
    a = a.toLowerCase();
    return i == a ? 0 : (i < a ? -1 : 1);
};
LIB.sortByTitle = (L) => {
    L.sort((bim, bam) => { return LIB.cmp(bim.title, bam.title); });
};
LIB.sortBy = (L, fn) => {
    L.sort((bim, bam) => { return LIB.cmp(fn(bim), fn(bam)); });
};
LIB.forAll = (L, fn) => {
    if (!L)
        return [];
    var nL = [];
    L.forEach((el, idx) => {
        var r = fn(el, idx);
        if (r) {
            if (Array.isArray(r))
                nL.push(...r);
            else
                nL.push(r);
        }
        ;
    });
    return nL;
};
LIB.addIcon = (str, ic) => {
    if (ic)
        return ic + '&#xa0;' + str;
    return str;
};
LIB.cacheE = (L, e) => {
    let n = typeof (e) == 'string' ? L.indexOf(e) : LIB.indexById(L, e.id);
    if (e.predecessor) {
        let p = typeof (e.predecessor) == 'string' ? L.indexOf(e.predecessor) : LIB.indexById(L, e.predecessor.id);
        delete e.predecessor;
        if (p > -1) {
            if (n > -1)
                L.splice(n, 1);
            L.splice(p + 1, 0, e);
            return p + 1;
        }
    }
    ;
    if (n > -1) {
        L[n] = e;
        return n;
    }
    else
        L.push(e);
    return L.length - 1;
};
LIB.cacheL = (L, es) => {
    for (var e of es)
        LIB.cacheE(L, e);
    return true;
};
LIB.uncacheE = (L, e) => {
    let n = LIB.isKey(e) ? LIB.indexByKey(L, e) : L.indexOf(e);
    if (n > -1)
        L.splice(n, 1);
    return n;
};
LIB.uncacheL = (L, es) => {
    let ok = true;
    es.forEach((e) => { ok = ok && LIB.uncacheE(L, e) > -1; });
    return ok;
};
LIB.randomString = () => {
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', result = '';
    for (var i = CONFIG.genIdLength; i > 0; --i)
        result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
};
LIB.genID = (pfx) => {
    if (!pfx || pfx.length < 1) {
        pfx = 'ID_';
    }
    ;
    if (!RE.Id.test(pfx)) {
        pfx = '_' + pfx;
    }
    ;
    return pfx + LIB.randomString();
};
LIB.getHeight = (elm) => {
    return $(elm).outerHeight(true) ?? 0;
};
String.prototype.toCamelCase = function () {
    let str = this.replace(/[^a-z\d \:\.]/ig, ''), parts, res = '';
    if (str.includes(':'))
        parts = str.split(':');
    else if (str.includes('.'))
        parts = str.split('.');
    else if (str.includes(' '))
        parts = str.split(' ');
    else if (str.includes('-'))
        parts = str.split('-');
    else if (str.includes('_'))
        parts = str.split('_');
    else
        return this;
    for (let p of parts) {
        p = p.replace(/[ _\-\.]/g, '');
        for (let i = 0, I = p.length; i < I; i++)
            res += i == 0 ? p[i].toUpperCase() : p[i].toLowerCase();
    }
    ;
    return res;
};
String.prototype.toJsId = function () {
    return this.replace(/[-:\.\,\s\(\)\[\]\/\\#�%]/g, '_');
};
String.prototype.toSpecifId = function () {
    return (/[^_a-zA-Z]/.test(this[0]) ? '_' : '') + this.replace(/[^_a-zA-Z\d.-]/g, '_');
};
String.prototype.stripHTML = function () {
    return $("<dummy/>").html(this).text().trim() || '';
};
String.prototype.stripCtrl = function () {
    return this.replace(/\n|\r|\t|\b|\f|\v/g, '');
};
String.prototype.ctrl2HTML = function () {
    return this.replace(/\r|\f/g, '')
        .replace(/&#x0{0,3}a;/gi, '')
        .replace(/\t/g, '&#160;&#160;&#160;&#160;')
        .replace(/\n/g, '<br />')
        .replace(/&#x0{0,3}d;/gi, '<br />');
};
String.prototype.makeHTML = function (opts) {
    if (typeof (opts) == 'object' && opts.makeHTML) {
        let newS = this
            .linkifyURLs(opts)
            .replace(/--(?:&gt;|>)/g, '&#8594;')
            .replace(/(?:&lt;|<)--/g, '&#8592;')
            .replace(/(?:&reg|\(R\))/g, '&#174;')
            .replace(/(?:&copy|\(C\))/g, '&#169;');
        if (CONFIG.convertMarkdown && window.markdown) {
            return window.markdown.render(newS
                .replace(/^\s+/, "")
                .replace(/\+ /g, '&#x2b; ')
                .replace(/• /g, '* '))
                .replace(/<br ?\/>\n/g, "<br/>")
                .stripCtrl();
        }
        ;
        return '<div>' + newS.ctrl2HTML() + '</div>';
    }
    ;
    return this;
};
LIB.xmlChar2utf8 = (str) => {
    str = str.replace(/&#x([\da-fA-F]+);/g, function (match, numStr) {
        return String.fromCharCode(parseInt(numStr, 16));
    });
    return str.replace(/&#(\d+);/g, function (match, numStr) {
        return String.fromCharCode(parseInt(numStr, 10));
    });
};
LIB.toHTML = (str) => {
    return str.escapeHTML().ctrl2HTML();
};
LIB.isHTML = (str) => {
    let doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some(node => node.nodeType == 1);
};
LIB.escapeInnerHtml = (str) => {
    var out = "";
    str = str.replace(RE.innerHtmlTag, function ($0, $1, $2, $3, $4) {
        out += $1.escapeXML() + $2 + $3 + $4;
        return '';
    });
    out += str.escapeXML();
    return out;
};
String.prototype.escapeRE = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
String.prototype.escapeJSON = function () {
    return this.replace(/["\\]/g, '\$&')
        .replace(/\u000A/g, '\n')
        .replace(/\u0009/g, '\t')
        .replace(/\[\u0000-\u001F]/g, '');
};
String.prototype.escapeXML = function () {
    return this.replace(RE.AmpersandPlus, ($0, $1) => {
        if (RE.XMLEntity.test($0))
            return $0;
        return '&#38;' + $1;
    })
        .replace(/[<>"']/g, ($0) => {
        return "&#" + { "<": "60", ">": "62", '"': "34", "'": "39" }[$0] + ";";
    });
};
String.prototype.escapeHTML = function () {
    return this.replace(/[&<>"'`=\/]/g, ($0) => {
        return "&#" + { "&": "38", "<": "60", ">": "62", '"': "34", "'": "39", "`": "x60", "=": "x3D", "/": "x2F" }[$0] + ";";
    });
};
String.prototype.unescapeHTMLTags = function () {
    if (LIB.isHTML(this))
        return this;
    return LIB.noCode(this.replace(RE.escapedHtmlTag, ($0, $1, $2, $3) => {
        return '<' + $1 + $2 + $3 + '>';
    }));
};
String.prototype.unescapeHTMLEntities = function () {
    var el = document.createElement('div');
    return LIB.noCode(this.replace(/\&#?x?[\da-z]+;/gi, (enc) => {
        el.innerHTML = enc;
        return el.innerText;
    }));
};
String.prototype.linkifyURLs = function (opts) {
    if (typeof (opts) == 'object' && opts.linkifyURLs)
        return this.replace(RE.URI, ($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) => {
            if (!$2.startsWith('http'))
                $2 = 'https://' + $2;
            return $1 + '<a href="' + $2 + '" target="_blank" >' + (opts && opts.label ? opts.label : $3 + ($4 || '') + $5) + '</a>' + $9;
        });
    return this;
};
String.prototype.fileExt = function () {
    let idx = this.lastIndexOf('.');
    return idx < 0 ? '' : this.substring(idx + 1);
};
String.prototype.baseName = function () {
    return this.substring(this.lastIndexOf('/') + 1);
};
String.prototype.fileName = function () {
    let idx = this.lastIndexOf('.');
    return this.substring(0, idx < 0 ? this.length : idx);
};
LIB.addFileExtIfMissing = (fn, ext) => {
    return fn == fn.fileName() ? fn + ext : fn;
};
LIB.addTimezoneIfMissing = (dt) => {
    if (typeof (dt) == 'string') {
        if (!RE.hasTimezone.test(dt)) {
            console.info("Added missing time-zone to " + dt);
            return dt + "Z";
        }
        ;
    }
    ;
    return dt;
};
LIB.trimJson = (str) => {
    return str.substring(str.indexOf('{'), str.lastIndexOf('}') + 1);
};
LIB.isTrue = (str) => {
    return str && CONFIG.valuesTrue.includes(str.toLowerCase().trim());
};
LIB.isFalse = (str) => {
    return str && CONFIG.valuesFalse.includes(str.toLowerCase().trim());
};
LIB.ab2str = (buf) => {
    let dataView = new DataView(buf), decoder = new TextDecoder('utf-8');
    return decoder.decode(dataView);
};
LIB.str2ab = (str) => {
    let encoder = new TextEncoder();
    return encoder.encode(str).buffer;
};
LIB.blob2dataURL = (file, fn, timelag) => {
    if (!file || !file.blob)
        return;
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => { fn(e.target.result, file.title, file.type); });
    if (typeof (timelag) == 'number' && timelag > 0)
        setTimeout(() => {
            reader.readAsDataURL(file.blob);
        }, timelag);
    else
        reader.readAsDataURL(file.blob);
};
LIB.blob2text = (file, fn, timelag) => {
    if (!file || !file.blob)
        return;
    const reader = new FileReader();
    reader.addEventListener('loadend', (e) => { fn(e.target.result, file.title, file.type); });
    if (typeof (timelag) == 'number' && timelag > 0)
        setTimeout(() => {
            reader.readAsText(file.blob);
        }, timelag);
    else
        reader.readAsText(file.blob);
};
LIB.validXML = (xml) => {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xml, "text/xml");
    return xmlDoc.getElementsByTagName('parsererror').length < 1;
};
LIB.uriBack2slash = (str) => {
    return str.replace(/<(?:object[^>]+?data=|img[^>]+?href=)"([^"]+)"[^>]*?\/?>/g, ($0) => {
        return $0.replace(/(?:data=|href=)"([^"]+)"/g, ($0) => {
            return $0.replace(/\\/g, '/');
        });
    });
};
LIB.noCode = (s) => {
    let REstyle = /<style[^>]*>[\s\S]*<\/style[^>]*>/i;
    if (s) {
        if (/<[^>]+\son[a-z]+=[^>]+>/i.test(s)) {
            log(911);
            return '';
        }
        ;
        if (/<script[^>]*>[\s\S]*<\/script[^>]*>/i.test(s)) {
            log(912);
            return '';
        }
        ;
        if (REstyle.test(s)) {
            s = s.replace(REstyle, '');
            console.warn("An inline style definition is considered harmful (913) and has been suppressed");
            return s;
        }
        ;
        if (/<embed[^>]*>[\s\S]*<\/embed[^>]*>/i.test(s)) {
            log(914);
            return '';
        }
        ;
        if (/<iframe[^>]*>[\s\S]*<\/iframe[^>]*>/i.test(s)) {
            log(915);
            return '';
        }
        ;
    }
    ;
    return s;
    function log(c) {
        console.warn("'" + s + "' is considered harmful (" + c + ") and has been suppressed");
    }
};
LIB.cleanValue = (o) => {
    if (typeof (o) == 'string')
        return LIB.noCode(o);
    if (Array.isArray(o))
        return LIB.forAll(o, (val) => {
            let t = LIB.cleanValue(val.text);
            if (t) {
                val.text = t;
                return val;
            }
        });
    throw Error('Unexpected input to LIB.cleanValue: Programming error with all likelihood');
};
LIB.attachment2mediaType = (fname) => {
    let t = fname.fileExt();
    if (t) {
        let ti = CONFIG.imgExtensions.indexOf(t.toLowerCase());
        if (ti > -1)
            return CONFIG.imgTypes[ti];
        ti = CONFIG.officeExtensions.indexOf(t.toLowerCase());
        if (ti > -1)
            return CONFIG.officeTypes[ti];
        ti = CONFIG.applExtensions.indexOf(t.toLowerCase());
        if (ti > -1)
            return CONFIG.applTypes[ti];
    }
    ;
};
LIB.localDateTime = (iso) => {
    if (iso.length > 11)
        return (iso.substring(0, 10) + ' ' + iso.substring(11, 16) + 'h');
    return (iso.substring(0, 10));
};
LIB.httpGet = (params) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', params.url, true);
    if (params.withCredentials)
        xhr.withCredentials = true;
    xhr.responseType = params.responseType;
    xhr.onreadystatechange = function () {
        if (this.readyState < 4)
            return;
        if (this.readyState == 4) {
            switch (this.status) {
                case 200:
                case 201:
                    if (typeof (params.done) == "function")
                        params.done(this);
                    break;
                default:
                    if (typeof (params.fail) == "function")
                        params.fail(this);
            }
            ;
        }
        ;
        if (typeof (params.then) == "function")
            params.then();
    };
    xhr.send(null);
};
LIB.isReferencedByHierarchy = (itm, H) => {
    if (!H)
        H = app.projects.selected.cache.nodes;
    return LIB.iterateSpecifNodes(H, (nd) => { return nd.resource.id != itm.id; });
};
LIB.referencedResources = (rL, h) => {
    var crL = [];
    LIB.iterateSpecifNodes(h, (nd) => { LIB.cacheE(crL, LIB.itemByKey(rL, nd.resource)); return true; });
    return crL;
};
LIB.referencedResourcesByClass = (rL, h, rCIdL) => {
    let crL = [];
    (LIB.iterateSpecifNodes(h, (nd) => {
        let r = LIB.itemById(rL, nd.resource.id);
        if (r && rCIdL.includes(r['class'].id)) {
            crL.push(r);
        }
        ;
        return true;
    }));
    return crL;
};
LIB.dataTypeOf = (key, prj) => {
    if (LIB.isKey(key)) {
        let pC = LIB.itemByKey(prj.propertyClasses, key), dT = pC ? LIB.itemByKey(prj.dataTypes, pC.dataType) : undefined;
        if (dT)
            return dT;
        else
            throw Error("dataType of '" + key.id + "' not found in SpecIF data-set with id " + prj.id);
    }
    ;
    return { type: XsDataType.String };
};
LIB.iterateSpecifNodes = (tree, eFn, lFn, _parent) => {
    let cont = true;
    if (Array.isArray(tree)) {
        for (let i = 0, I = tree.length; cont && (i < I); i++) {
            cont = !LIB.iterateSpecifNodes(tree[i], eFn, lFn, _parent);
        }
        ;
        if (typeof (lFn) == 'function')
            lFn(tree);
    }
    else {
        cont = eFn(tree, _parent);
        if (cont && tree.nodes) {
            _parent = tree.id;
            cont = !LIB.iterateSpecifNodes(tree.nodes, eFn, lFn, _parent);
        }
        ;
    }
    ;
    return !cont;
};
LIB.createProp = (pC, key) => {
    let _pC = Array.isArray(pC) ? LIB.itemByKey(pC, key) : pC;
    return {
        class: LIB.keyOf(_pC),
        values: _pC.values ?? []
    };
};
LIB.propByTitle = (itm, pN, dta) => {
    var iCL = LIB.getExtendedClasses(dta.resourceClasses, [itm['class']]), prp;
    if (iCL.length < 1)
        throw Error("Data inconsistent: LIB.getExtendedClasses doesn't return a result for " + itm['class'].id);
    for (var pC of dta.propertyClasses) {
        if (LIB.referenceIndex(iCL[0].propertyClasses, pC) > -1
            && pC.title == pN) {
            prp = LIB.referenceItemBy(itm.properties, 'class', pC);
            if (prp)
                return prp;
            prp = LIB.createProp(pC);
            itm.properties.push(prp);
            return prp;
        }
        ;
    }
    ;
};
LIB.titleOf = (item, opts) => {
    if (item)
        return (opts && opts.lookupTitles ?
            (opts.targetLanguage ?
                app.ontology.localize(item.title, opts)
                : app.ontology.changeNamespace(item.title, opts))
            : item.title);
    throw Error("Programming error: Input parameter 'item' is not defined");
};
LIB.classTitleOf = (iCkey, cL, opts) => {
    let iC = LIB.itemByKey(cL, iCkey);
    if (iC)
        return LIB.titleOf(iC, opts);
};
LIB.hasResClass = (r, pNs, dta) => {
    return pNs.includes(LIB.classTitleOf(r['class'], dta.resourceClasses));
};
LIB.hasType = (r, pNs, dta, opts) => {
    if (r) {
        let pVs = LIB.valuesByTitle(r, [CONFIG.propClassType], dta);
        if (pVs.length > 0) {
            return pNs.includes(LIB.displayValueOf(pVs[0], opts));
        }
        ;
        return false;
    }
    ;
    throw Error("Programming Error: No resource or statement specified");
};
LIB.titleIdx = (pL, pCs) => {
    if (Array.isArray(pL) && pL.length > 0) {
        for (var a = 0, A = pL.length; a < A; a++) {
            let pt = LIB.classTitleOf(pL[a]['class'], pCs);
            if (CONFIG.titleProperties.includes(pt))
                return a;
        }
    }
    ;
    return -1;
};
LIB.titleFromProperties = (pL, pCs, opts) => {
    let idx = LIB.titleIdx(pL, pCs);
    if (idx > -1) {
        let ti = LIB.languageTextOf(pL[idx].values[0], opts).stripHTML();
        if (ti)
            return (opts && opts.lookupValues ? app.ontology.localize(ti, opts) : ti);
    }
    ;
    return '';
};
LIB.typeOf = (rK, dta) => {
    let r = rK["class"] ? rK : LIB.itemByKey(dta.resources, rK), pVL = LIB.valuesByTitle(r, [CONFIG.propClassType], dta);
    return pVL.length > 0 ? LIB.displayValueOf(pVL[0]) : undefined;
};
function simpleHash(str) {
    for (var r = 0, i = 0; i < str.length; i++)
        r = (r << 5) - r + str.charCodeAt(i), r &= r;
    return 10000000000 + r;
}
function simpleClone(o) {
    function cloneProp(p) {
        return (typeof (p) == 'object') ? simpleClone(p) : p;
    }
    if (o != null) {
        if (typeof (o) == 'object' && !(o instanceof Blob)) {
            var n;
            if (Array.isArray(o))
                n = [];
            else
                n = {};
            for (var p in o) {
                if (Array.isArray(o[p])) {
                    n[p] = [];
                    o[p].forEach((op) => { n[p].push(cloneProp(op)); });
                    continue;
                }
                ;
                n[p] = cloneProp(o[p]);
            }
            ;
            return n;
        }
        ;
        if (typeof (o) != 'function')
            return o;
    }
    ;
}
function getUrlParams(opts) {
    if (typeof (opts) != 'object')
        opts = {};
    if (typeof (opts.start) != 'string')
        opts.start = '#';
    if (typeof (opts.separator) != 'string')
        opts.separator = ';';
    let p = document.URL.split(opts.start);
    if (!p[1])
        return {};
    return parse(decodeURI(p[1]));
    function parse(h) {
        if (!h)
            return {};
        if (h.charAt(0) == '/')
            h = h.substring(1);
        var pO = {};
        h.split(opts.separator).forEach((p) => {
            p = p.split('=');
            if (p[1] && ['"', "'"].includes(p[1][0]))
                p[1] = p[1].substring(1, p[1].length - 1);
            if (CONFIG.urlParamTags.includes(p[0]))
                pO[p[0]] = p[1];
            else
                console.warn("Unknown URL-Parameter '", p[0], "' found.");
        });
        return pO;
    }
}
function setUrlParams(actSt) {
    if (!browser.supportsHtml5History || !actSt)
        return;
    let quO = getUrlParams(), view = actSt.view.substring(1);
    if (quO.project == actSt.project
        && quO[CONFIG.keyView] == view
        && quO[CONFIG.keyNode] == actSt.node) {
        return;
    }
    ;
    let path = window.location.pathname.split('/'), newParams = path[path.length - 1], is = '=', sep = ';';
    newParams += '#'
        + CONFIG.keyView + is + view
        + (actSt.project ? sep + CONFIG.keyProject + is + actSt.project : "")
        + (actSt.node ? sep + CONFIG.keyNode + is + actSt.node : (actSt.item ? sep + CONFIG.keyItem + is + actSt.item : ''));
    history.pushState('', '', newParams);
}
