"use strict";
/*!
*   SpecIF to Turtle Transformation
*   (C)copyright enso managers gmbh (http://enso-managers.de)
*   Author: se@enso-managers.de, Berlin
*   License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
*   We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*
*   Assumptions:
*   - specifData is expected in v1.2 format.
*   - opts.baseURI ends with '/' or '#' ... check??
*   - identifiers have been replaced by ontology terms, if given in the respective title (method updateWithOntology)
*
*   SHACL
*       see: https://www.ontotext.com/knowledgehub/fundamentals/what-is-shacl/
*       and: https://book.validatingrdf.com/bookHtml011.html
*       and: https://graphdb.ontotext.com/documentation/10.8/shacl-validation.html
*       and: https://www.ida.liu.se/~robke04/SHACLTutorial/Introduction%20to%20SHACL.pdf
*       and: https://archive.topquadrant.com/technology/shacl/tutorial/
*       and: https://shacl.dev/article/Top_10_SHACL_rules_for_RDF_validation.html
*       and: https://www.w3.org/TR/shacl/
*/
var PigItemType;
(function (PigItemType) {
    PigItemType["Organizer"] = "pig:Organizer";
    PigItemType["Entity"] = "pig:Entity";
    PigItemType["Relationship"] = "pig:Relationship";
    PigItemType["Outline"] = "pig:Outline";
    PigItemType["View"] = "pig:View";
})(PigItemType || (PigItemType = {}));
var PigProperty;
(function (PigProperty) {
    PigProperty["eligibleSource"] = "pig:eligibleSource";
    PigProperty["eligibleTarget"] = "pig:eligibleTarget";
    PigProperty["eligibleElement"] = "pig:eligibleElement";
    PigProperty["lists"] = "pig:lists";
    PigProperty["shows"] = "pig:shows";
    PigProperty["depicts"] = "pig:depicts";
    PigProperty["icon"] = "pig:Icon";
})(PigProperty || (PigProperty = {}));
var RdfsProperty;
(function (RdfsProperty) {
    RdfsProperty["type"] = "rdf:type";
    RdfsProperty["label"] = "rdfs:label";
    RdfsProperty["comment"] = "rdfs:comment";
    RdfsProperty["subClassOf"] = "rdfs:subClassOf";
    RdfsProperty["subPropertyOf"] = "rdfs:subPropertyOf";
    RdfsProperty["domain"] = "rdfs:domain";
    RdfsProperty["range"] = "rdfs:range";
})(RdfsProperty || (RdfsProperty = {}));
var ShaclProperty;
(function (ShaclProperty) {
    ShaclProperty["nodeShape"] = "sh:NodeShape";
    ShaclProperty["propertyShape"] = "sh:PropertyShape";
    ShaclProperty["targetClass"] = "sh:targetClass";
    ShaclProperty["property"] = "sh:property";
    ShaclProperty["path"] = "sh:path";
    ShaclProperty["class"] = "sh:class";
    ShaclProperty["datatype"] = "sh:datatype";
    ShaclProperty["maxLength"] = "sh:maxLength";
    ShaclProperty["minInclusive"] = "sh:minInclusive";
    ShaclProperty["maxInclusive"] = "sh:maxInclusive";
    ShaclProperty["minCount"] = "sh:minCount";
    ShaclProperty["maxCount"] = "sh:maxCount";
    ShaclProperty["pattern"] = "sh:pattern";
})(ShaclProperty || (ShaclProperty = {}));
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
        if (object != undefined) {
            let ending = this.lastTab < 1 ? "" : " ;";
            this.lastTab = 1;
            return this.makeLines(ending + `\n\t${predicate} `, object, quote);
        }
        ;
        return "";
    }
    tab2(object, quote) {
        if (this.lastTab < 1)
            throw Error("Predicate is missing");
        if (object != undefined) {
            let ending = " ,";
            this.lastTab = 2;
            return this.makeLines(ending + `\n\t\t`, object, quote);
        }
        ;
        return "";
    }
    makeLines(prefix, object, quote) {
        switch (typeof (object)) {
            case 'number':
            case 'boolean':
                object = object.toString();
            case 'string':
                return object.length > 0 ? prefix + `${quote || ''}${this.escapeTtl(object)}${quote || ''}` : "";
            default:
                if (!quote)
                    throw Error("Multilanguage text must be quoted");
                if (object.length < 2) {
                    let v = object[0];
                    return prefix + `"${this.escapeTtl(v['text'])}"${v.language ? "@" + v.language : ""}`;
                }
                ;
                let str = "";
                for (let v of object) {
                    if (!v.language)
                        console.error("Multilanguage text must have a language specified if there are multiple language versions:", v);
                    str += prefix + `"${this.escapeTtl(v['text'])}"@${v.language}`;
                }
                ;
                return str;
        }
        ;
    }
    escapeTtl(str) {
        if (str)
            return str.replace("\\", "\\\\").replace(/\u000a|\u000d/g, '').replace(/"/g, '\\$&');
    }
    makeShaclList(pred, L) {
        let str = "";
        if (Array.isArray(L) && L.length > 0) {
            str = this.tab1(pred, '[ ');
            for (let i = 0; i < L.length; i++) {
                if (L[i].obj)
                    str += '\n\t\t' + L[i].prd + ' ' + L[i].obj + (i < L.length - 1 ? ' ;' : '');
            }
            ;
            str += '\n\t]';
        }
        ;
        return str;
    }
    makeObjectUnion(ont, L) {
        let str = "";
        if (Array.isArray(L) && L.length > 0) {
            if (L.length > 1) {
                if (L.length > 10)
                    console.warn("Many elements in a union: " + L.length + ", beware of performance issues with RDF processors.");
                str = '[ owl:unionOf(';
                for (let i = 0; i < L.length; i++) {
                    str += " " + LIB.makeIdWithNamespace(ont, L[i].id ?? L[i]);
                }
                ;
                str += " )]";
            }
            else
                str += LIB.makeIdWithNamespace(ont, L[0].id ?? L[0]);
        }
        ;
        return str;
    }
}
app.specif2turtle = (specifData, opts) => {
    const self = 'd:', sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '#'), ont = "o:", ontURI = opts.baseURI + "ontology#", suffixShape = "-Shape", suffixHasSrc = "-hasSource", suffixHasTrg = "-hasTarget", extendedClasses = LIB.getExtendedClasses(specifData.resourceClasses, 'all')
        .concat(LIB.getExtendedClasses(specifData.statementClasses, 'all'));
    let toRdf = new CToRdf();
    let result = defineNamespaces()
        + transformProjectMetadata(specifData)
        + definePigClasses()
        + transformDatatypes(specifData.dataTypes)
        + transformPropertyClasses(specifData.propertyClasses)
        + transformResourceClasses(specifData.resourceClasses)
        + transformStatementClasses(specifData.statementClasses)
        + transformResources(specifData.resources)
        + transformStatements(specifData.statements)
        + transformHierarchies(specifData.nodes)
        + toRdf.newLine();
    return result;
    function isOntologyTerm(id) {
        return !['pig-ol', 'rdf', 'rdfs', 'owl', 'xs', 'xsd'].includes(id.split(':')[0]);
    }
    function defineNamespaces() {
        let pfxL = '';
        for (var [key, val] of app.ontology.namespaces) {
            pfxL += toRdf.prefix(key.replace('.', ':'), val.url);
        }
        ;
        pfxL += toRdf.prefix('sh:', 'http://www.w3.org/ns/shacl#')
            + toRdf.newLine()
            + toRdf.prefix(ont, ontURI)
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
            + toRdf.tab1(RdfsProperty.type, 'owl:Ontology')
            + toRdf.tab1(RdfsProperty.label, title, '"')
            + toRdf.tab1(RdfsProperty.comment, description, '"')
            + toRdf.tab1('owl:imports', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
            + toRdf.tab2('<http://www.w3.org/2000/01/rdf-schema#>')
            + (rights ? (toRdf.tab1('dcterms:license', '<' + rights.url + '>')) : '')
            + (createdBy ? (toRdf.tab1('dcterms:creator', '<mailto:' + createdBy.email + '>')) : '')
            + toRdf.tab1('dcterms:createdAt', createdAt, '"');
        return ttlStr;
    }
    ;
    function definePigClasses() {
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('### META-ONTOLOGY = PIG Metamodel (pig:)')
            + toRdf.newLine('#################################################################')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.Organizer)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.label, 'Organizer', '"')
            + toRdf.tab1(RdfsProperty.comment, 'A PIG meta-model element used for organizing model-elements.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.Entity)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.label, 'Entity', '"')
            + toRdf.tab1(RdfsProperty.comment, 'A PIG meta-model element used for entities (aka resources or artifacts).', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.Relationship)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.label, 'Relationship', '"')
            + toRdf.tab1(RdfsProperty.comment, 'A PIG meta-model element used for reified relationships (aka predicates).', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigProperty.eligibleSource)
            + toRdf.tab1(RdfsProperty.type, 'owl:ObjectProperty')
            + toRdf.tab1(RdfsProperty.domain, PigItemType.Relationship)
            + toRdf.tab1(RdfsProperty.range, PigItemType.Entity)
            + toRdf.tab1(RdfsProperty.label, 'has source', '"')
            + toRdf.tab1(RdfsProperty.comment, 'Connects the source of a reified relationship.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigProperty.eligibleTarget)
            + toRdf.tab1(RdfsProperty.type, 'owl:ObjectProperty')
            + toRdf.tab1(RdfsProperty.domain, PigItemType.Relationship)
            + toRdf.tab1(RdfsProperty.range, PigItemType.Entity)
            + toRdf.tab1(RdfsProperty.label, 'has target', '"')
            + toRdf.tab1(RdfsProperty.comment, 'Connects the target of a reified relationship.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigProperty.eligibleElement)
            + toRdf.tab1(RdfsProperty.type, 'owl:ObjectProperty')
            + toRdf.tab1(RdfsProperty.domain, PigItemType.Organizer)
            + toRdf.tab1(RdfsProperty.range, toRdf.makeObjectUnion(ont, [PigItemType.Entity, PigItemType.Relationship, PigItemType.Organizer]))
            + toRdf.tab1(RdfsProperty.label, 'has element', '"')
            + toRdf.tab1(RdfsProperty.comment, 'References an entity, a relationship or a subordinated organizer.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigProperty.lists)
            + toRdf.tab1(RdfsProperty.subPropertyOf, PigProperty.eligibleElement)
            + toRdf.tab1(RdfsProperty.domain, PigItemType.Outline)
            + toRdf.tab1(RdfsProperty.label, 'lists', '"')
            + toRdf.tab1(RdfsProperty.comment, 'Lists (references) an entity, a relationship or a subordinated organizer.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigProperty.shows)
            + toRdf.tab1(RdfsProperty.subPropertyOf, PigProperty.eligibleElement)
            + toRdf.tab1(RdfsProperty.domain, PigItemType.View)
            + toRdf.tab1(RdfsProperty.range, toRdf.makeObjectUnion(ont, [PigItemType.Entity, PigItemType.Relationship]))
            + toRdf.tab1(RdfsProperty.label, 'shows', '"')
            + toRdf.tab1(RdfsProperty.comment, 'Shows (references) an entity or a relationship.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigProperty.depicts)
            + toRdf.tab1(RdfsProperty.subPropertyOf, PigProperty.eligibleElement)
            + toRdf.tab1(RdfsProperty.domain, PigItemType.View)
            + toRdf.tab1(RdfsProperty.range, PigItemType.Entity)
            + toRdf.tab1(RdfsProperty.label, 'depicts', '"')
            + toRdf.tab1(RdfsProperty.comment, 'Depicts an entity; inverse of uml:ownedDiagram.', '"');
        return ttlStr;
    }
    function transformDatatypes(dTs) {
        if (!isArrayWithContent(dTs))
            return '';
        function hasDatatypeWithEnumeration() {
            for (let dT of dTs)
                if (isArrayWithContent(dT.enumeration))
                    return true;
        }
        if (!hasDatatypeWithEnumeration())
            return '';
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Data Types with Enumerated Values')
            + toRdf.newLine('#################################################################');
        dTs.forEach(dT => {
            const ti = dT.title, dtId = LIB.makeIdWithNamespace(ont, dT.id);
            if (isArrayWithContent(dT.enumeration)) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(dtId)
                    + toRdf.tab1(RdfsProperty.type, 'owl:Class')
                    + toRdf.tab1(RdfsProperty.label, ti, '"')
                    + toRdf.tab1(RdfsProperty.comment, 'Enumerated Values for ' + LIB.displayValueOf(ti, { targetLanguage: 'default', lookupValues: true }), '"')
                    + toRdf.tab1('dcterms:modified', dT.changedAt, '"')
                    + toRdf.tab1('owl:oneOf', '(');
                dT.enumeration.forEach(item => {
                    ttlStr += ' ' + LIB.makeIdWithNamespace(ont, item.id);
                });
                ttlStr += ' )';
                dT.enumeration.forEach(item => {
                    let vId = LIB.makeIdWithNamespace(ont, item.id), termR = app.ontology.getTermResource('propertyValue', vId);
                    ttlStr += toRdf.tab0(vId)
                        + toRdf.tab1(RdfsProperty.type, dtId)
                        + toRdf.tab1(RdfsProperty.label, item.value, '"')
                        + toRdf.tab1(RdfsProperty.comment, termR ? app.ontology.getDescriptions(termR) : undefined, '"');
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
            + toRdf.newLine('# Ontology - Property Classes')
            + toRdf.newLine('#################################################################');
        pCs.forEach(pC => {
            const dT = LIB.itemByKey(specifData.dataTypes, pC.dataType), ty = dT.enumeration ? 'owl:ObjectProperty' : 'owl:DatatypeProperty', pcId = LIB.makeIdWithNamespace(ont, pC.id);
            if (isOntologyTerm(pcId)) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(pcId)
                    + toRdf.tab1(RdfsProperty.type, ty)
                    + toRdf.tab1(RdfsProperty.subClassOf, PigItemType.PropertyClass)
                    + toRdf.tab1(RdfsProperty.label, pC.title, '"')
                    + toRdf.tab1(RdfsProperty.comment, pC.description, '"')
                    + toRdf.tab1(RdfsProperty.range, dT.enumeration ? LIB.makeIdWithNamespace(ont, dT.id) : undefined);
                +toRdf.tab1('dcterms:modified', pC.changedAt, '"');
                const dt = dT.type.replace('xs:', 'xsd:');
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(pcId + suffixShape)
                    + toRdf.tab1(RdfsProperty.type, ShaclProperty.propertyShape)
                    + toRdf.tab1(ShaclProperty.path, pcId)
                    + toRdf.tab1(ShaclProperty.minCount, pC.required ? '1' : undefined, '"')
                    + toRdf.tab1(ShaclProperty.maxCount, pC.multiple ? undefined : '1', '"');
                if (dT.enumeration)
                    ttlStr += toRdf.tab1(ShaclProperty.class, LIB.makeIdWithNamespace(ont, dT.id));
                else {
                    ttlStr += toRdf.tab1(ShaclProperty.datatype, dt)
                        + toRdf.tab1(ShaclProperty.maxLength, dT.maxLength, '"')
                        + toRdf.tab1(ShaclProperty.minInclusive, dT.minInclusive, '"')
                        + toRdf.tab1(ShaclProperty.maxInclusive, dT.maxInclusive, '"')
                        + toRdf.tab1(ShaclProperty.pattern, dT.fractionDigits ? `^\\d+(\\\\.\\\\d{0,${dT.fractionDigits}})?$` : undefined, '"');
                }
                ;
            }
            ;
        });
        return ttlStr;
    }
    ;
    function makeClassShape(eC) {
        const ecId = LIB.makeIdWithNamespace(ont, eC.id);
        let ttlStr = toRdf.newLine()
            + toRdf.tab0(ecId + suffixShape)
            + toRdf.tab1(RdfsProperty.type, ShaclProperty.NodeShape)
            + toRdf.tab1(ShaclProperty.targetClass, ecId);
        if (isArrayWithContent(eC.propertyClasses)) {
            eC.propertyClasses.forEach((pC) => {
                ttlStr += toRdf.tab1(ShaclProperty.property, LIB.makeIdWithNamespace(ont, pC.id) + suffixShape);
            });
        }
        ;
        return ttlStr;
    }
    function transformResourceClasses(rCL) {
        if (!isArrayWithContent(rCL))
            return '';
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Ontology - Entity Classes')
            + toRdf.newLine('#################################################################');
        rCL.forEach(rC => {
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(rC)), entId = LIB.makeIdWithNamespace(ont, rC.id), ity = app.ontology.organizerClasses.includes(entId) ? PigItemType.Organizer : PigItemType.Entity;
            if (['pig:Element', 'pig:Entity', 'pig:Relationship', 'pig:Organizer'].includes(entId))
                return;
            if (isOntologyTerm(entId)) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(entId)
                    + toRdf.tab1(RdfsProperty.subClassOf, (rC.extends ? LIB.makeIdWithNamespace(ont, rC.extends.id) : ity))
                    + toRdf.tab1(RdfsProperty.label, rC.title, '"')
                    + toRdf.tab1(RdfsProperty.comment, rC.description, '"')
                    + toRdf.tab1(PigProperty.icon, rC.icon, '"')
                    + toRdf.tab1('dcterms:modified', rC.changedAt, '"');
                ttlStr += makeClassShape(exC);
            }
            ;
        });
        return ttlStr;
    }
    ;
    function transformStatementClasses(sCL) {
        if (!isArrayWithContent(sCL))
            return '';
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Ontology - Relationship Classes')
            + toRdf.newLine('#################################################################');
        sCL.forEach(sC => {
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(sC)), relId = LIB.makeIdWithNamespace(ont, sC.id);
            if (['SpecIF:shows', 'uml:ownedDiagram'].includes(relId))
                return;
            if (isOntologyTerm(relId)) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(relId)
                    + toRdf.tab1(RdfsProperty.subClassOf, (sC.extends ? LIB.makeIdWithNamespace(ont, sC.extends.id) : PigItemType.Relationship))
                    + toRdf.tab1(RdfsProperty.label, sC.title, '"')
                    + toRdf.tab1(RdfsProperty.comment, sC.description, '"')
                    + toRdf.tab1(PigProperty.icon, sC.icon, '"')
                    + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                    + toRdf.newLine()
                    + toRdf.tab0(relId + suffixHasSrc)
                    + toRdf.tab1(RdfsProperty.subPropertyOf, PigProperty.eligibleSource)
                    + toRdf.tab1(RdfsProperty.label, "Connects the source of " + relId, '"')
                    + toRdf.tab1(RdfsProperty.domain, relId)
                    + toRdf.tab1(RdfsProperty.range, toRdf.makeObjectUnion(ont, sC.subjectClasses))
                    + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                    + toRdf.newLine()
                    + toRdf.tab0(relId + suffixHasTrg)
                    + toRdf.tab1(RdfsProperty.subPropertyOf, PigProperty.eligibleTarget)
                    + toRdf.tab1(RdfsProperty.label, "Connects the target of " + relId, '"')
                    + toRdf.tab1(RdfsProperty.domain, relId)
                    + toRdf.tab1(RdfsProperty.range, toRdf.makeObjectUnion(ont, sC.objectClasses))
                    + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                    + makeClassShape(exC)
                    + toRdf.makeShaclList(ShaclProperty.property, [
                        { prd: ShaclProperty.path, obj: relId + suffixHasSrc },
                        { prd: ShaclProperty.class, obj: toRdf.makeObjectUnion(ont, sC.subjectClasses) },
                        { prd: ShaclProperty.minCount, obj: '1' },
                        { prd: ShaclProperty.maxCount, obj: '1' }
                    ])
                    + toRdf.makeShaclList(ShaclProperty.property, [
                        { prd: ShaclProperty.path, obj: relId + suffixHasTrg },
                        { prd: ShaclProperty.class, obj: toRdf.makeObjectUnion(ont, sC.objectClasses) },
                        { prd: ShaclProperty.minCount, obj: '1' },
                        { prd: ShaclProperty.maxCount, obj: '1' }
                    ]);
            }
            ;
        });
        return ttlStr;
    }
    ;
    function transformProperties(el) {
        let ttlStr = '';
        if (isArrayWithContent(el.properties)) {
            el.properties.forEach(p => {
                if (p.values.length > 0) {
                    let pred = LIB.makeIdWithNamespace(ont, p['class'].id);
                    if (p.values[0].id) {
                        const pC = LIB.itemByKey(specifData.propertyClasses, LIB.makeKey(p['class'].id));
                        ttlStr += toRdf.tab1(pred, LIB.makeIdWithNamespace(ont, p.values[0].id));
                    }
                    else
                        ttlStr += toRdf.tab1(pred, LIB.displayValueOf(p.values[0], { targetLanguage: 'default', lookupValues: true }), '"');
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
                + toRdf.newLine('# Entities')
                + toRdf.newLine('#################################################################');
            rL.forEach(r => {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + r.id)
                    + toRdf.tab1(RdfsProperty.type, LIB.makeIdWithNamespace(ont, r['class'].id))
                    + transformProperties(r)
                    + toRdf.tab1('dcterms:modified', r.changedAt, '"');
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
                + toRdf.newLine('# Relationships')
                + toRdf.newLine('#################################################################');
            sL.forEach(s => {
                let sCId = LIB.makeIdWithNamespace(ont, s['class'].id);
                switch (sCId) {
                    case 'SpecIF:shows':
                        ttlStr += toRdf.newLine()
                            + toRdf.tab0(self + s.subject.id)
                            + toRdf.tab1(PigProperty.shows, self + s.object.id);
                        break;
                    case 'uml:ownedDiagram':
                        ttlStr += toRdf.newLine()
                            + toRdf.tab0(self + s.object.id)
                            + toRdf.tab1(PigProperty.depicts, self + s.subject.id);
                        break;
                    default:
                        ttlStr += toRdf.newLine()
                            + toRdf.tab0(self + s.id)
                            + toRdf.tab1(RdfsProperty.type, sCId)
                            + toRdf.tab1(sCId + suffixHasSrc, self + s.subject.id)
                            + toRdf.tab1(sCId + suffixHasTrg, self + s.object.id)
                            + transformProperties(s)
                            + toRdf.tab1('dcterms:modified', s.changedAt, '"');
                }
                ;
            });
            return ttlStr;
        }
        ;
        return '';
    }
    ;
    function transformHierarchies(nodes) {
        if (isArrayWithContent(nodes)) {
            let usedFolders = [], ttlStr = toRdf.newLine()
                + toRdf.newLine('#################################################################')
                + toRdf.newLine('# Hierarchies')
                + toRdf.newLine('#################################################################')
                + toRdf.newLine()
                + toRdf.tab0(self + 'HierarchyRoot')
                + toRdf.tab1(RdfsProperty.type, 'pig:HierarchyRoot')
                + toRdf.tab1(RdfsProperty.label, 'Hierarchy Root', '"')
                + toRdf.tab1(RdfsProperty.comment, '... anchoring all hierarchies of this graph (project)', '"');
            nodes.forEach((nd, idx) => {
                if (idx == 0)
                    ttlStr += toRdf.tab1(PigProperty.lists, self + nd.id);
                else
                    ttlStr += toRdf.tab2(self + nd.id);
            });
            LIB.iterateSpecifNodes(nodes, (tree) => {
                if (isArrayWithContent(tree.nodes)) {
                    if (usedFolders.includes(tree.id))
                        console.warn("RDF/Turtle Export: Hierarchy Node " + tree.id + " with children appears more than once.");
                    else
                        usedFolders.push(tree.id);
                }
                ;
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + tree.id)
                    + toRdf.tab1('dcterms:modified', tree.changedAt, '"')
                    + toRdf.tab1(PigProperty.lists, self + tree.resource.id);
                if (Array.isArray(tree.nodes))
                    tree.nodes.forEach((nd, i) => {
                        if (i == 0)
                            ttlStr += toRdf.tab1(PigProperty.lists, self + nd.id);
                        else
                            ttlStr += toRdf.tab2(self + nd.id);
                    });
                return true;
            });
            return ttlStr;
        }
        return '';
    }
    ;
    function isArrayWithContent(array) {
        return (Array.isArray(array) && array.length > 0);
    }
};
