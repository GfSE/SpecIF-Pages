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
    PigItemType["PropertyClass"] = "pig:PropertyClass";
    PigItemType["OrganizerClass"] = "pig:OrganizerClass";
    PigItemType["EntityClass"] = "pig:EntityClass";
    PigItemType["RelationshipClass"] = "pig:RelationshipClass";
    PigItemType["Organizer"] = "pig:Organizer";
    PigItemType["Entity"] = "pig:Entity";
    PigItemType["Relationship"] = "pig:Relationship";
})(PigItemType || (PigItemType = {}));
var PigProperty;
(function (PigProperty) {
    PigProperty[PigProperty["hasSubject"] = 'pig:hasSubject'] = "hasSubject";
    PigProperty[PigProperty["hasObject"] = 'pig:hasObject'] = "hasObject";
    PigProperty[PigProperty["hasPart"] = 'dcterms:hasPart'] = "hasPart";
    PigProperty[PigProperty["hasItem"] = 'pig:hasElement'] = "hasItem";
    PigProperty[PigProperty["hasChild"] = 'pig:hasChild'] = "hasChild";
    PigProperty[PigProperty["icon"] = 'pig:Icon'] = "icon";
})(PigProperty || (PigProperty = {}));
var RdfsProperty;
(function (RdfsProperty) {
    RdfsProperty[RdfsProperty["type"] = 'rdf:type'] = "type";
    RdfsProperty[RdfsProperty["label"] = 'rdfs:label'] = "label";
    RdfsProperty[RdfsProperty["comment"] = 'rdfs:comment'] = "comment";
    RdfsProperty[RdfsProperty["subClassOf"] = 'rdfs:subClassOf'] = "subClassOf";
    RdfsProperty[RdfsProperty["subPropertyOf"] = 'rdfs:subPropertyOf'] = "subPropertyOf";
    RdfsProperty[RdfsProperty["domain"] = 'rdfs:domain'] = "domain";
    RdfsProperty[RdfsProperty["range"] = 'rdfs:range'] = "range";
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
        if (object) {
            let ending = this.lastTab < 1 ? "" : " ;";
            this.lastTab = 1;
            return ending + `\n\t${predicate} ${quote || ''}${this.escapeTtl(Array.isArray(object) ? object[0]['text'] : object)}${quote || ''}`;
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
            return ending + `\n\t\t${quote || ''}${this.escapeTtl(Array.isArray(object) ? object[0]['text'] : object)}${quote || ''}`;
        }
        ;
        return "";
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
                    str += " " + LIB.makeIdWithNamespace(ont, L[i].id);
                }
                ;
                str += " )]";
            }
            else
                str += LIB.makeIdWithNamespace(ont, L[0].id);
        }
        ;
        return str;
    }
}
app.specif2turtle = (specifData, opts) => {
    const self = 'd:', sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '#'), ont = "o:", ontURI = opts.baseURI + "ontology#", suffixShape = "-Shape", suffixHasSbj = "-hasSubject", suffixHasObj = "-hasObject", extendedClasses = LIB.getExtendedClasses(specifData.resourceClasses, 'all')
        .concat(LIB.getExtendedClasses(specifData.statementClasses, 'all'));
    let toRdf = new CToRdf(), enumPCs = [];
    let result = defineNamespaces()
        + transformProjectMetadata(specifData)
        + definePigClasses()
        + transformDatatypes(specifData.dataTypes)
        + transformResourceClasses(specifData.resourceClasses)
        + transformStatementClasses(specifData.statementClasses)
        + transformResources(specifData.resources)
        + transformStatements(specifData.statements)
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
            + toRdf.prefix(self, sourceURI)
            + toRdf.prefix(ont, ontURI);
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
            + toRdf.tab0(PigItemType.OrganizerClass)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.label, 'Organizer Class', '"')
            + toRdf.tab1(RdfsProperty.comment, 'A class of organizers.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.Organizer)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.subClassOf, 'owl:Thing')
            + toRdf.tab1(RdfsProperty.label, 'Organizer', '"')
            + toRdf.tab1(RdfsProperty.comment, 'An organizer.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.EntityClass)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.label, 'Entity Class', '"')
            + toRdf.tab1(RdfsProperty.comment, 'A class of entities.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.Entity)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.subClassOf, 'owl:Thing')
            + toRdf.tab1(RdfsProperty.label, 'Entity', '"')
            + toRdf.tab1(RdfsProperty.comment, 'An entity.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.RelationshipClass)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.label, 'Relationship Class', '"')
            + toRdf.tab1(RdfsProperty.comment, 'A class of relationship resources.', '"')
            + toRdf.newLine()
            + toRdf.tab0(PigItemType.Relationship)
            + toRdf.tab1(RdfsProperty.type, 'owl:Class')
            + toRdf.tab1(RdfsProperty.subClassOf, 'owl:Thing')
            + toRdf.tab1(RdfsProperty.label, 'Relationship', '"')
            + toRdf.tab1(RdfsProperty.comment, 'A relationship resource.', '"')
            + toRdf.newLine()
            + toRdf.tab0('pig:itemType')
            + toRdf.tab1(RdfsProperty.type, 'owl:ObjectProperty')
            + toRdf.tab1(RdfsProperty.label, 'has PIG metamodel item type', '"')
            + toRdf.tab1(RdfsProperty.range, `[ owl:unionOf (${Object.keys(PigItemType).map(k => ` ${PigItemType[k]}`).join('')} ) ]`);
        return ttlStr;
    }
    function transformDatatypes(dTs) {
        if (!isArrayWithContent(dTs))
            return '';
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Data Types with Enumerated Values')
            + toRdf.newLine('#################################################################');
        dTs.forEach(dT => {
            const rdfId = LIB.makeIdWithNamespace(ont, dT.id);
            if (isArrayWithContent(dT.enumeration)) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(rdfId)
                    + toRdf.tab1(RdfsProperty.type, 'owl:Class')
                    + toRdf.tab1(RdfsProperty.label, dT.title.replace('.', ':'), '"')
                    + toRdf.tab1(RdfsProperty.comment, dT.description, '"')
                    + toRdf.tab1('dcterms:modified', dT.changedAt, '"')
                    + toRdf.tab1('owl:oneOf', '(');
                dT.enumeration.forEach(item => {
                    ttlStr += ' ' + rdfId + '-' + item.id;
                });
                ttlStr += ' )';
                dT.enumeration.forEach(item => {
                    ttlStr += toRdf.tab0(rdfId + '-' + item.id)
                        + toRdf.tab1(RdfsProperty.type, rdfId)
                        + toRdf.tab1(RdfsProperty.label, item.value[0].text, '"');
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
            let dT = LIB.itemByKey(specifData.dataTypes, pC.dataType), ti = pC.title.replace('.', ':');
            if (dT.enumeration) {
                enumPCs.push(pC.id);
                ttlStr += toRdf.newLine()
                    + toRdf.newLine()
                    + toRdf.tab0(self + pC.id)
                    + toRdf.tab1(RdfsProperty.type, 'owl:ObjectProperty');
            }
            else {
                let dt = dT.type.replace('xs:', 'xsd:'), term = app.ontology.getTermResource('propertyClass', pC.title);
                if (term && !['rdf', 'rdfs', 'owl'].includes(ti.split(':')[0])) {
                    ttlStr += toRdf.newLine()
                        + toRdf.tab0(ti)
                        + toRdf.tab1(RdfsProperty.type, 'owl:DatatypeProperty')
                        + toRdf.tab1(RdfsProperty.comment, getDescFromOntology(term), '"');
                }
                ;
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + pC.id + suffixShape)
                    + toRdf.tab1(RdfsProperty.type, 'sh:PropertyShape')
                    + toRdf.tab1('sh:path', self + pC.id)
                    + toRdf.tab1('sh:datatype', dt)
                    + toRdf.tab1('sh:maxLength', dT.maxLength ? dT.maxLength.toString() : undefined, '"')
                    + toRdf.tab1('sh:minInclusive', dT.minInclusive ? dT.minInclusive.toString() : undefined, '"')
                    + toRdf.tab1('sh:maxInclusive', dT.maxInclusive ? dT.maxInclusive.toString() : undefined, '"')
                    + toRdf.tab1('sh:minCount', pC.required ? '1' : undefined, '"')
                    + toRdf.tab1('sh:maxCount', pC.multiple ? undefined : '1', '"');
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + pC.id);
                if (term)
                    ttlStr += toRdf.tab1('owl:subPropertyOf', ti);
                else
                    ttlStr += toRdf.tab1(RdfsProperty.type, 'owl:DatatypeProperty');
            }
            ;
            ttlStr += toRdf.tab1(RdfsProperty.label, ti, '"')
                + toRdf.tab1(RdfsProperty.comment, pC.description, '"')
                + toRdf.tab1('dcterms:modified', pC.changedAt, '"');
        });
        return ttlStr;
    }
    ;
    function MakeClassShape(meC) {
        let ttlStr = toRdf.newLine()
            + toRdf.tab0(self + meC.id + suffixShape)
            + toRdf.tab1(RdfsProperty.type, 'sh:NodeShape')
            + toRdf.tab1('sh:targetClass', self + meC.id);
        if (isArrayWithContent(meC.propertyClasses)) {
            let noSh = [];
            meC.propertyClasses.forEach((pC) => {
                if (enumPCs.includes(pC.id))
                    noSh.push(pC.id);
                else
                    ttlStr += toRdf.tab1('sh:property', self + pC.id + suffixShape);
            });
            if (noSh.length > 0)
                ttlStr += toRdf.newLine("# No shapes yet for propertyClasses with enumerated dataType: " + noSh.toString());
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
            rC = LIB.itemByKey(extendedClasses, LIB.keyOf(rC));
            let ti = rC.title.replace('.', ':'), rdfId = LIB.makeIdWithNamespace(ont, rC.id), ity = app.ontology.organizerClasses.includes(ti) ? PigItemType.OrganizerClass : PigItemType.EntityClass;
            ttlStr += toRdf.newLine()
                + toRdf.tab0(rdfId)
                + toRdf.tab1(RdfsProperty.type, 'owl:Class')
                + toRdf.tab1(RdfsProperty.subClassOf, (rC.extends ? LIB.makeIdWithNamespace(ont, rC.extends.id) : ity))
                + toRdf.tab1(RdfsProperty.label, ti, '"')
                + toRdf.tab1(RdfsProperty.comment, rC.description, '"')
                + toRdf.tab1(PigProperty.icon, rC.icon, '"')
                + toRdf.tab1('dcterms:modified', rC.changedAt, '"');
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
            sC = LIB.itemByKey(extendedClasses, LIB.keyOf(sC));
            let ti = sC.title.replace('.', ':'), rdfId = LIB.makeIdWithNamespace(ont, sC.id);
            ttlStr += toRdf.newLine()
                + toRdf.tab0(rdfId)
                + toRdf.tab1(RdfsProperty.type, 'owl:Class')
                + toRdf.tab1(RdfsProperty.subClassOf, (sC.extends ? LIB.makeIdWithNamespace(ont, sC.extends.id) : PigItemType.RelationshipClass))
                + toRdf.tab1(RdfsProperty.label, ti, '"')
                + toRdf.tab1(RdfsProperty.comment, sC.description, '"')
                + toRdf.tab1(PigProperty.icon, sC.icon, '"')
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                + toRdf.newLine()
                + toRdf.tab0(rdfId + suffixHasSbj)
                + toRdf.tab1(RdfsProperty.type, 'owl:ObjectProperty')
                + toRdf.tab1(RdfsProperty.label, "Connects the subject of " + rdfId, '"')
                + toRdf.tab1(RdfsProperty.domain, rdfId)
                + toRdf.tab1(RdfsProperty.range, toRdf.makeObjectUnion(ont, sC.subjectClasses))
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                + toRdf.newLine()
                + toRdf.tab0(rdfId + suffixHasObj)
                + toRdf.tab1(RdfsProperty.type, 'owl:ObjectProperty')
                + toRdf.tab1(RdfsProperty.label, "Connects the object of " + rdfId, '"')
                + toRdf.tab1(RdfsProperty.domain, rdfId)
                + toRdf.tab1(RdfsProperty.range, toRdf.makeObjectUnion(ont, sC.objectClasses))
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                + toRdf.newLine()
                + toRdf.tab0(rdfId + suffixShape)
                + toRdf.tab1(RdfsProperty.type, ShaclProperty.nodeShape)
                + toRdf.tab1(ShaclProperty.targetClass, rdfId)
                + toRdf.makeShaclList(ShaclProperty.property, [
                    { prd: ShaclProperty.path, obj: rdfId + suffixHasSbj },
                    { prd: ShaclProperty.class, obj: toRdf.makeObjectUnion(ont, sC.subjectClasses) },
                    { prd: ShaclProperty.minCount, obj: '1' },
                    { prd: ShaclProperty.maxCount, obj: '1' }
                ])
                + toRdf.makeShaclList(ShaclProperty.property, [
                    { prd: ShaclProperty.path, obj: rdfId + suffixHasObj },
                    { prd: ShaclProperty.class, obj: toRdf.makeObjectUnion(ont, sC.objectClasses) },
                    { prd: ShaclProperty.minCount, obj: '1' },
                    { prd: ShaclProperty.maxCount, obj: '1' }
                ]);
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
                        ttlStr += toRdf.tab1(pred, pC.dataType.id + '-' + p.values[0].id);
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
                    + toRdf.tab1(RdfsProperty.subClassOf, PigItemType.Entity)
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
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + s.id)
                    + toRdf.tab1(RdfsProperty.type, sCId)
                    + toRdf.tab1(RdfsProperty.subClassOf, PigItemType.Relationship)
                    + toRdf.tab1(sCId + suffixHasSbj, self + s.subject.id)
                    + toRdf.tab1(sCId + suffixHasObj, self + s.object.id)
                    + transformProperties(s)
                    + toRdf.tab1('dcterms:modified', s.changedAt, '"');
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
                + toRdf.tab0(self + 'N-HierarchyRoot')
                + toRdf.tab1(RdfsProperty.type, PigItemType.Organizer)
                + toRdf.tab1(RdfsProperty.label, 'Hierarchy Root', '"')
                + toRdf.tab1(RdfsProperty.comment, '... anchoring all hierarchies of this graph (project)', '"');
            nodes.forEach((nd, idx) => {
                if (idx == 0)
                    ttlStr += toRdf.tab1(PigProperty.hasChild, self + nd.id);
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
                    + toRdf.tab1(PigProperty.hasItem, self + tree.resource.id);
                if (Array.isArray(tree.nodes))
                    tree.nodes.forEach((nd, i) => {
                        if (i == 0)
                            ttlStr += toRdf.tab1(PigProperty.hasChild, self + nd.id);
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
    function getTitleFromOntology(term) {
        return app.ontology.valueByTitle(term, CONFIG.propClassLocalTerm);
    }
    function getDescFromOntology(term) {
        return app.ontology.valueByTitle(term, CONFIG.propClassDesc);
    }
};
