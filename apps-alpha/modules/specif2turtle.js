"use strict";
/*!
    SpecIF to Turtle Transformation
    (C)copyright adesso SE, enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*/
function escapeTtl(str) {
    return str.replace("\\", "\\\\").replace(/"/g, '\\$&');
    ;
}
class CToRdf {
    constructor() {
        this.lastTab = -1;
    }
    newLine(str) {
        if (this.lastTab == 0)
            throw Error("Previous triple is incomplete");
        let ending = this.lastTab < 0 ? "" : " .";
        this.lastTab = -1;
        return ending + `\n` + (str ? str : "");
    }
    prefix(tag, url) {
        return this.newLine(`@prefix ${tag} <${url}> .`);
    }
    tab0(subject) {
        if (this.lastTab == 0)
            throw Error("Previous triple is incomplete");
        let ending = this.lastTab < 0 ? "" : " .";
        this.lastTab = 0;
        return ending + `\n${subject}`;
    }
    tab1(predicate, object, quote) {
        if (this.lastTab < 0)
            throw Error("Subject is missing");
        if (object) {
            let ending = this.lastTab < 1 ? "" : " ;";
            this.lastTab = 1;
            return ending + `\n\t${predicate} ${quote || ''}${escapeTtl(Array.isArray(object) ? object[0]['text'] : object)}${quote || ''}`;
        }
        ;
        return "";
    }
    tab2(object, quote) {
        if (this.lastTab < 1)
            throw Error("Predicate is missing");
        if (object) {
            let ending = " ,";
            this.lastTab = 2;
            return ending + `\n\t\t${quote || ''}${escapeTtl(Array.isArray(object) ? object[0]['text'] : object)}${quote || ''}`;
        }
        ;
        return "";
    }
}
app.specif2turtle = (specifData, opts) => {
    const self = ':', sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '/'), hasSbj = "-hasSubject", hasObj = "-hasObject";
    let toRdf = new CToRdf(), enumPCs = [], extendedClasses = LIB.getExtendedClasses(specifData.resourceClasses, 'all')
        .concat(LIB.getExtendedClasses(specifData.statementClasses, 'all'));
    let result = defineNamespaces()
        + transformProjectMetadata(specifData)
        + transformDatatypes(specifData.dataTypes)
        + transformPropertyClasses(specifData.propertyClasses)
        + transformResourceClasses(specifData.resourceClasses)
        + transformStatementClasses(specifData.statementClasses)
        + transformResources(specifData.resources)
        + transformStatements(specifData.statements)
        + transformHierarchies(specifData.nodes)
        + toRdf.newLine();
    return result;
    function defineNamespaces() {
        let pfxL = '';
        for (var [key, val] of app.ontology.namespaces) {
            pfxL += toRdf.prefix(key.replace('.', ':'), val.url);
        }
        ;
        pfxL += toRdf.prefix('sh:', 'http://www.w3.org/ns/shacl#')
            + toRdf.newLine()
            + toRdf.prefix(self, sourceURI);
        return pfxL;
    }
    ;
    function transformProjectMetadata(project) {
        let { id, title, description, $schema, generator, generatorVersion, rights, createdAt, createdBy } = project;
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Project Metadata')
            + toRdf.newLine('#################################################################')
            + toRdf.newLine()
            + toRdf.tab0(self)
            + toRdf.tab1('a', 'owl:Ontology')
            + toRdf.tab1('rdfs:label', title, '"')
            + toRdf.tab1('rdfs:comment', description, '"')
            + toRdf.tab1('owl:imports', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
            + toRdf.tab2('<http://www.w3.org/2000/01/rdf-schema#>');
        +(rights ? (toRdf.tab1('dcterms:license', '<' + rights.url + '>')) : '')
            + (createdBy ? (toRdf.tab1('dcterms:creator', '<mailto:' + createdBy.email + '>')) : '')
            + toRdf.tab1('dcterms:createdAt', createdAt, '"');
        return ttlStr;
    }
    ;
    function transformDatatypes(dTs) {
        if (!isArrayWithContent(dTs))
            return '';
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Data Types with Enumerated Values')
            + toRdf.newLine('#################################################################');
        dTs.forEach(dT => {
            if (isArrayWithContent(dT.enumeration)) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + dT.id)
                    + toRdf.tab1('a', 'owl:Class')
                    + toRdf.tab1('rdfs:label', dT.title, '"')
                    + toRdf.tab1('rdfs:comment', dT.description, '"')
                    + toRdf.tab1('dcterms:modified', dT.changedAt, '"')
                    + toRdf.tab1('owl:oneOf', '(');
                dT.enumeration.forEach(item => {
                    ttlStr += ' ' + self + item.id;
                });
                ttlStr += ' )';
                dT.enumeration.forEach(item => {
                    ttlStr += toRdf.tab0(self + item.id)
                        + toRdf.tab1('a', self + dT.id)
                        + toRdf.tab1('rdfs:label', item.value[0].text, '"');
                });
            }
            ;
        });
        return ttlStr;
    }
    ;
    function transformPropertyClasses(pCs) {
        if (!isArrayWithContent(pCs))
            return '';
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Property Classes')
            + toRdf.newLine('#################################################################');
        pCs.forEach(pC => {
            let dT = LIB.itemByKey(specifData.dataTypes, pC.dataType);
            if (dT.enumeration) {
                enumPCs.push(pC.id);
                ttlStr += toRdf.newLine()
                    + toRdf.newLine("# No shape yet for propertyClass with enumerated dataType: " + pC.id)
                    + toRdf.newLine()
                    + toRdf.tab0(self + pC.id)
                    + toRdf.tab1('a', 'owl:ObjectProperty')
                    + toRdf.tab1('rdfs:label', pC.title, '"')
                    + toRdf.tab1('rdfs:comment', pC.description, '"')
                    + toRdf.tab1('rdfs:range', self + pC.dataType.id);
            }
            else {
                let dt = dT.type.replace('xs:', 'xsd:');
                switch (dT.type) {
                    case XsDataType.String:
                        ttlStr += toRdf.newLine()
                            + toRdf.tab0(self + pC.id + "-Shape")
                            + toRdf.tab1('a', 'sh:PropertyShape')
                            + toRdf.tab1('sh:path', self + pC.id)
                            + toRdf.tab1('sh:datatype', dt)
                            + toRdf.tab1('sh:maxLength', dT.maxLength ? dT.maxLength.toString() : undefined, '"');
                }
                ;
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + pC.id)
                    + toRdf.tab1('a', 'owl:DatatypeProperty')
                    + toRdf.tab1('owl:subPropertyOf', pC.title == 'dcterms:title' ? "rdfs:label" : "")
                    + toRdf.tab1('owl:subPropertyOf', pC.title == 'dcterms:description' ? "rdfs:comment" : "")
                    + toRdf.tab1('rdfs:label', pC.title, '"')
                    + toRdf.tab1('rdfs:comment', pC.description, '"')
                    + toRdf.tab1('rdfs:range', dt);
            }
            ;
            ttlStr += toRdf.tab1('dcterms:modified', pC.changedAt, '"');
        });
        return ttlStr;
    }
    ;
    function MakeClassShape(meC) {
        if (isArrayWithContent(meC.propertyClasses)) {
            let ttlStr = toRdf.newLine()
                + toRdf.tab0(self + meC.id + "-Shape")
                + toRdf.tab1('a', 'sh:NodeShape')
                + toRdf.tab1('sh:targetClass', self + meC.id);
            let noSh = [];
            meC.propertyClasses.forEach((pC) => {
                if (enumPCs.includes(pC.id))
                    noSh.push(pC.id);
                else
                    ttlStr += toRdf.tab1('sh:property', self + pC.id + "-Shape");
            });
            if (noSh.length > 0)
                ttlStr += toRdf.newLine("# No shapes yet for propertyClasses with enumerated dataType: " + noSh.toString());
            return ttlStr;
        }
        ;
        return '';
    }
    function transformResourceClasses(rCL) {
        if (!isArrayWithContent(rCL))
            return '';
        let hTerm = app.ontology.getTermResource('resourceClass', CONFIG.resClassHierarchyRoot), rTerm = app.ontology.getTermResource('resourceClass', CONFIG.resClassResource);
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Resource Classes')
            + toRdf.newLine('#################################################################')
            + toRdf.newLine()
            + toRdf.tab0(CONFIG.resClassHierarchyRoot)
            + toRdf.tab1('a', 'owl:Class')
            + toRdf.tab1('rdfs:label', app.ontology.valueByTitle(hTerm, CONFIG.propClassLocalTerm), '"')
            + toRdf.tab1('rdfs:comment', app.ontology.valueByTitle(hTerm, CONFIG.propClassDesc), '"')
            + toRdf.newLine()
            + toRdf.tab0(CONFIG.resClassResource)
            + toRdf.tab1('a', 'owl:Class')
            + toRdf.tab1('rdfs:label', app.ontology.valueByTitle(rTerm, CONFIG.propClassLocalTerm), '"')
            + toRdf.tab1('rdfs:comment', app.ontology.valueByTitle(rTerm, CONFIG.propClassDesc), '"');
        rCL.forEach(rC => {
            rC = LIB.itemByKey(extendedClasses, LIB.keyOf(rC));
            ttlStr += MakeClassShape(rC);
            ttlStr += toRdf.newLine()
                + toRdf.tab0(self + rC.id)
                + toRdf.tab1('a', 'owl:Class')
                + toRdf.tab1('rdfs:subClassOf', CONFIG.resClassResource)
                + toRdf.tab1('rdfs:label', rC.title, '"')
                + toRdf.tab1('SpecIF:Icon', rC.icon, '"')
                + toRdf.tab1('rdfs:comment', rC.description, '"');
        });
        return ttlStr;
    }
    ;
    function transformStatementClasses(sCL) {
        if (!isArrayWithContent(sCL))
            return '';
        let sTerm = app.ontology.getTermResource('resourceClass', CONFIG.resClassStatement), sTti = app.ontology.valueByTitle(sTerm, CONFIG.propClassLocalTerm), sTdsc = app.ontology.valueByTitle(sTerm, CONFIG.propClassDesc);
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Statement Classes')
            + toRdf.newLine('#################################################################')
            + toRdf.newLine()
            + toRdf.tab0(CONFIG.resClassStatement)
            + toRdf.tab1('a', 'owl:Class')
            + toRdf.tab1('rdfs:label', sTti, '"')
            + toRdf.tab1('rdfs:comment', sTdsc, '"')
            + toRdf.newLine()
            + toRdf.tab0('SpecIF:hasSubject')
            + toRdf.tab1('a', 'owl:ObjectProperty')
            + toRdf.newLine()
            + toRdf.tab0('SpecIF:hasObject')
            + toRdf.tab1('a', 'owl:ObjectProperty')
            + toRdf.newLine()
            + toRdf.tab0('dcterms:hasPart')
            + toRdf.tab1('a', 'owl:ObjectProperty')
            + toRdf.newLine()
            + toRdf.tab0('SpecIF:hasItem')
            + toRdf.tab1('a', 'owl:ObjectProperty')
            + toRdf.tab1('owl:subPropertyOf', 'dcterms:hasPart');
        sCL.forEach(sC => {
            sC = LIB.itemByKey(extendedClasses, LIB.keyOf(sC));
            ttlStr += MakeClassShape(sC)
                + toRdf.newLine()
                + toRdf.tab0(self + sC.id)
                + toRdf.tab1('a', 'owl:Class')
                + toRdf.tab1('rdfs:subClassOf', CONFIG.resClassStatement)
                + toRdf.tab1('rdfs:label', sC.title, '"')
                + toRdf.tab1('rdfs:comment', sC.description, '"')
                + toRdf.tab1('SpecIF:Icon', sC.icon, '"')
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                + toRdf.newLine()
                + toRdf.tab0(self + sC.id + hasSbj)
                + toRdf.tab1('a', 'owl:ObjectProperty')
                + toRdf.tab1('rdfs:subPropertyOf', 'SpecIF:hasSubject')
                + toRdf.tab1('rdfs:label', "Connects the subject of " + self + sC.id, '"')
                + toRdf.tab1('rdfs:domain', self + sC.id)
                + makeObjectList('rdfs:range', sC.subjectClasses)
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                + toRdf.newLine()
                + toRdf.tab0(self + sC.id + hasObj)
                + toRdf.tab1('a', 'owl:ObjectProperty')
                + toRdf.tab1('rdfs:subPropertyOf', 'SpecIF:hasObject')
                + toRdf.tab1('rdfs:label', "Connects the object of " + self + sC.id, '"')
                + toRdf.tab1('rdfs:domain', self + sC.id)
                + makeObjectList('rdfs:range', sC.objectClasses)
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"');
        });
        return ttlStr;
    }
    ;
    function transformProperties(el) {
        let ttlStr = '';
        if (isArrayWithContent(el.properties)) {
            el.properties.forEach(p => {
                if (p.values.length > 0) {
                    if (p.values[0].id)
                        ttlStr += toRdf.tab1(self + p['class'].id, self + p.values[0].id);
                    else
                        ttlStr += toRdf.tab1(self + p['class'].id, LIB.displayValueOf(p.values[0], { targetLanguage: 'default', lookupValues: true }), '"');
                }
            });
        }
        ;
        return ttlStr;
    }
    ;
    function transformResources(rL) {
        if (isArrayWithContent(rL)) {
            let ttlStr = toRdf.newLine()
                + toRdf.newLine('#################################################################')
                + toRdf.newLine('# Resources')
                + toRdf.newLine('#################################################################');
            rL.forEach(r => {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + r.id)
                    + toRdf.tab1('a', self + r['class'].id)
                    + transformProperties(r);
            });
            return ttlStr;
        }
        ;
        return '';
    }
    ;
    function transformStatements(sL) {
        if (isArrayWithContent(sL)) {
            let ttlStr = toRdf.newLine()
                + toRdf.newLine('#################################################################')
                + toRdf.newLine('# Statements')
                + toRdf.newLine('#################################################################');
            sL.forEach(s => {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + s.id)
                    + toRdf.tab1('a', self + s['class'].id)
                    + toRdf.tab1(self + s['class'].id + hasSbj, self + s.subject.id)
                    + toRdf.tab1(self + s['class'].id + hasObj, self + s.object.id)
                    + transformProperties(s);
            });
            return ttlStr;
        }
        ;
        return '';
    }
    ;
    function transformHierarchies(nodes) {
        if (isArrayWithContent(nodes)) {
            let lastParent = "", usedFolders = [], ttlStr = toRdf.newLine()
                + toRdf.newLine('#################################################################')
                + toRdf.newLine('# Hierarchies')
                + toRdf.newLine('#################################################################')
                + toRdf.newLine()
                + toRdf.tab0(self + 'HierarchyRoot')
                + toRdf.tab1('a', CONFIG.resClassHierarchyRoot)
                + toRdf.tab1('rdfs:label', 'Hierarchy Root', '"')
                + toRdf.tab1('rdfs:comment', '... anchoring all hierarchies of this graph (project)', '"');
            LIB.iterateSpecifNodes(specifData.nodes, (tree, _parent) => {
                _parent = _parent || 'HierarchyRoot';
                if (isArrayWithContent(tree.nodes)) {
                    if (usedFolders.includes(tree.id))
                        console.warn("RDF/Turtle Export: Hierarchy Node " + tree.id + " with children appears more than once.");
                    else
                        usedFolders.push(tree.id);
                }
                ;
                if (lastParent != _parent) {
                    lastParent = _parent;
                    ttlStr += toRdf.newLine()
                        + toRdf.tab0(self + _parent);
                }
                ;
                ttlStr += toRdf.tab1('SpecIF:hasItem', self + tree.resource.id);
                return true;
            });
            return ttlStr;
        }
        return '';
    }
    ;
    function makeObjectList(pred, L) {
        let str = "";
        if (Array.isArray(L) && L.length > 0) {
            if (L.length > 1) {
                str += toRdf.tab1(pred, '[ owl:unionOf(');
                for (let i = 0; i < L.length; i++) {
                    str += " " + self + L[i].id;
                }
                ;
                str += " )]";
            }
            else
                str += toRdf.tab1(pred, self + L[0].id);
        }
        ;
        return str;
    }
    function isArrayWithContent(array) {
        return (Array.isArray(array) && array.length > 0);
    }
};
