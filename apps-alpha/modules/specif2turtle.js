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
*
*   Andreas Müller: Don't mix class and instance level in RDF triples!
*/
var PigItemType;
(function (PigItemType) {
    PigItemType["Property"] = "pig:Property";
    PigItemType["aProperty"] = "pig:aProperty";
    PigItemType["Reference"] = "pig:Reference";
    PigItemType["Element"] = "pig:Element";
    PigItemType["Organizer"] = "pig:Organizer";
    PigItemType["anOrganizer"] = "pig:anOrganizer";
    PigItemType["Entity"] = "pig:Entity";
    PigItemType["anEntity"] = "pig:anEntity";
    PigItemType["Relationship"] = "pig:Relationship";
    PigItemType["aRelationship"] = "pig:aRelationship";
    PigItemType["HierarchyRoot"] = "pig:HierarchyRoot";
    PigItemType["Outline"] = "pig:Outline";
    PigItemType["View"] = "pig:View";
})(PigItemType || (PigItemType = {}));
var PigProperty;
(function (PigProperty) {
    PigProperty["itemType"] = "pig:itemType";
    PigProperty["eligibleValue"] = "pig:eligibleValue";
    PigProperty["eligibleProperty"] = "pig:eligibleProperty";
    PigProperty["eligibleSource"] = "pig:eligibleSource";
    PigProperty["eligibleTarget"] = "pig:eligibleTarget";
    PigProperty["hasSource"] = "pig:hasSource";
    PigProperty["hasTarget"] = "pig:hasTarget";
    PigProperty["eligibleReference"] = "pig:eligibleReference";
    PigProperty["specializes"] = "pig:specializes";
    PigProperty["lists"] = "pig:lists";
    PigProperty["shows"] = "pig:shows";
    PigProperty["depicts"] = "pig:depicts";
    PigProperty["icon"] = "pig:icon";
    PigProperty["category"] = "pig:category";
    PigProperty["revision"] = "pig:revision";
    PigProperty["priorRevision"] = "pig:priorRevision";
})(PigProperty || (PigProperty = {}));
var DcProperty;
(function (DcProperty) {
    DcProperty["title"] = "dcterms:title";
    DcProperty["description"] = "dcterms:description";
    DcProperty["type"] = "dcterms:type";
    DcProperty["modified"] = "dcterms:modified";
    DcProperty["creator"] = "dcterms:creator";
    DcProperty["license"] = "dcterms:license";
})(DcProperty || (DcProperty = {}));
var RdfProperty;
(function (RdfProperty) {
    RdfProperty["type"] = "rdf:type";
    RdfProperty["label"] = "rdfs:label";
    RdfProperty["comment"] = "rdfs:comment";
    RdfProperty["subClassOf"] = "rdfs:subClassOf";
    RdfProperty["subPropertyOf"] = "rdfs:subPropertyOf";
    RdfProperty["domain"] = "rdfs:domain";
    RdfProperty["range"] = "rdfs:range";
})(RdfProperty || (RdfProperty = {}));
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
    ShaclProperty["or"] = "sh:or";
})(ShaclProperty || (ShaclProperty = {}));
const nsData = 'd:', nsOnto = "o:", suffixHasSrc = "-hasSource", suffixHasTrg = "-hasTarget", pfx_datatype = 'xsd:', pfx_shape = "pigShapes_", sfx_shape = "_shape", pigOnto = 'https://product-information-graph.org/v0.2/ontology', nsShapes = ['dcterms:', 'rdfs:', 'uml:', 'sysml:', 'FMC:', 'RFLP:', 'IREB:', 'oslc_rm:', 'oslc_cm:', 'ReqIF:', 'ReqIF-WF:', 'SpecIF:', 'pig:'], pigEntities = [
    [PigItemType.Entity, 'owl:Class', 'Entity', 'A PIG meta-model element used for entities (aka resources or artifacts).', [PigProperty.category, PigProperty.icon]],
    [PigItemType.Organizer, PigItemType.Entity, 'Organizer', 'An element organizing model elements. An example is a list of requirements or a diagram using a certain notation.', [PigProperty.category]],
    [PigItemType.HierarchyRoot, PigItemType.Organizer, 'Hierarchy Root', 'A subclass of PIG organizer serving as a root for hierarchically organized graph elements.', [], [PigProperty.lists]],
    [PigItemType.Outline, PigItemType.Organizer, 'Outline', 'A subclass of PIG organizer comprising all information items of a human-readable document. As usual, the outline is hierarchically organized.', [PigProperty.category], [PigProperty.lists]],
    [PigItemType.View, PigItemType.Organizer, 'View', 'A subclass of PIG organizer representing a model view (diagram) using a certain notation showing selected model elements.', [PigProperty.category, PigProperty.icon], [PigProperty.shows, PigProperty.depicts]]
], pigRelationships = [
    [PigItemType.Relationship, 'owl:Class', 'Relationship', 'A PIG meta-model element used for reified relationships (aka predicates).', [PigProperty.category], [PigItemType.Entity, PigItemType.Relationship], [PigItemType.Entity, PigItemType.Relationship]],
], pigProperties = [
    [PigProperty.icon, 'owl:DatatypeProperty', [PigItemType.Entity, PigItemType.Relationship], XsDataType.String, 'has icon', 'Specifies an icon for a model element (entity or relationship).', undefined, 0, 1],
    [PigProperty.category, DcProperty.type, [PigItemType.Entity, PigItemType.Relationship], XsDataType.String, 'has category', 'Specifies a category for an element (entity, relationship or organizer).', 32, 0, 1]
], pigReferences = [
    [PigProperty.eligibleSource, 'owl:ObjectProperty', [PigItemType.Relationship], [PigItemType.Entity, PigItemType.Relationship], 'has source', 'Connects the source of a reified relationship.'],
    [PigProperty.eligibleTarget, 'owl:ObjectProperty', [PigItemType.Relationship], [PigItemType.Entity, PigItemType.Relationship], 'has target', 'Connects the target of a reified relationship.'],
    [PigProperty.eligibleReference, 'owl:ObjectProperty', [PigItemType.Organizer], [PigItemType.Entity, PigItemType.Relationship, PigItemType.Organizer], 'references', 'References an entity, a relationship or a subordinated organizer.'],
    [PigProperty.lists, PigProperty.eligibleReference, [PigItemType.HierarchyRoot, PigItemType.Outline], [PigItemType.Entity, PigItemType.Relationship, PigItemType.Organizer], 'lists', 'Lists an entity, a relationship or a subordinated organizer.'],
    [PigProperty.shows, PigProperty.eligibleReference, [PigItemType.View], [PigItemType.Entity, PigItemType.Relationship], 'shows', 'Shows an entity or a relationship.'],
    [PigProperty.depicts, PigProperty.eligibleReference, [PigItemType.View], [PigItemType.Entity], 'depicts', 'Depicts an entity; inverse of uml:ownedDiagram.']
], pigNativeProperties = ['dcterms:title', 'dcterms:description'], rdfImplicit = ['rdf', 'rdfs', 'owl', 'xs', 'xsd'], diagramRels = ['SpecIF:shows', 'uml:ownedDiagram'], hierarchyItems = [CONFIG.resClassFolder, CONFIG.resClassOutline, CONFIG.resClassGlossary], excludeEntities = [PigItemType.Element].concat(pigEntities.map(en => en[0])), excludeRelationships = pigRelationships.map(rel => rel[0]), excludeProperties = pigProperties.concat(pigReferences).map(pr => pr[0]);
function isRdfImplicit(id) {
    return rdfImplicit.includes(id.split(':')[0]);
}
function isPigNative(str) {
    return pigNativeProperties.includes(str);
}
function makeShapeId(id) {
    return id.startsWith(nsOnto) ? id + sfx_shape : pfx_shape + id;
}
class CToRdf {
    constructor() {
        this.lastTab = -1;
    }
    heading(str) {
        return this.newLine()
            + this.newLine('#################################################################')
            + this.newLine('# ' + str)
            + this.newLine('#################################################################');
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
    tab1(predicate, object) {
        if (this.lastTab < 0)
            throw Error("Subject is missing");
        if (object != undefined) {
            let ending = this.lastTab < 1 ? "" : " ;";
            this.lastTab = 1;
            return this.makeLines(ending + `\n\t${predicate} `, object);
        }
        ;
        return "";
    }
    tab2(object) {
        if (this.lastTab < 1)
            throw Error("Predicate is missing");
        if (object != undefined) {
            let ending = " ,";
            this.lastTab = 2;
            return this.makeLines(ending + `\n\t\t`, object);
        }
        ;
        return "";
    }
    makeLines(prefix, object) {
        switch (typeof (object)) {
            case 'undefined':
                return "";
            case 'number':
            case 'boolean':
                object = object.toString();
            case 'string':
                if (object.length > 0) {
                    if (this.isNotLiteral(object))
                        return prefix + object;
                    else
                        return prefix + `"${this.escapeTtl(object)}"`;
                }
                ;
                return "";
            default:
                if (!LIB.isArrayWithContent(object)) {
                    console.error("specif2turtle: Expecting an array with items");
                    return "";
                }
                ;
                if (LIB.isMultiLanguageValue(object)) {
                    if (object.length < 2) {
                        let t = object[0].text, l = object[0].language;
                        if (this.isNotLiteral(t))
                            return prefix + `${t}`;
                        let languageTag = l ? `@${l}` : '';
                        return prefix + `"${this.escapeTtl(t)}"` + languageTag;
                    }
                    ;
                    let str = "";
                    for (let v of object) {
                        if (!v.language)
                            console.error("specif2turtle: Multilanguage text must have a language specified if there are multiple language versions:", v);
                        str += prefix + `"${this.escapeTtl(v['text'])}"@${v.language}`;
                    }
                    ;
                    return str;
                }
                else {
                    let str = '';
                    object.forEach((v, i) => {
                        str += (i == 0 ? prefix : " ,\n\t\t") + (this.isNotLiteral(v) ? v : `"${v}"`);
                    });
                    return str;
                }
                ;
        }
    }
    makeRdflList(ont, L) {
        let str = "";
        if (Array.isArray(L) && L.length > 0) {
            str = '(';
            for (let l of L) {
                str += '\n\t\t\t' + LIB.makeIdWithNamespace(ont, l.id ?? l);
            }
            ;
            str += '\n\t\t)';
        }
        ;
        return str;
    }
    makeShaclList(L) {
        let str = "";
        if (Array.isArray(L) && L.length > 0) {
            str = '[ ';
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
    makeShaclOr(ont, predicate, L) {
        if (LIB.isArrayWithContent(L)) {
            let str = "(";
            L.forEach((l) => {
                str += '\n\t\t\t[ ' + predicate + ' ' + LIB.makeIdWithNamespace(ont, l.id ?? l) + ' ]';
            });
            return str + '\n\t\t)';
        }
        else
            console.error("specif2turtle: Expecting an array of property shapes for 'sh:or'");
    }
    makeOwlUnion(ont, L) {
        let str = "";
        if (LIB.isArrayWithContent(L)) {
            if (L.length > 1) {
                if (L.length > 10)
                    console.warn("specif2turtle: Many elements in a union: " + L.length + ", beware of performance issues with RDF processors.");
                str = '[ owl:unionOf' + this.makeRdflList(ont, L) + "]";
            }
            else
                str += LIB.makeIdWithNamespace(ont, L[0].id ?? L[0]);
        }
        ;
        return str;
    }
    escapeTtl(str) {
        if (str)
            return str.replace("\\", "\\\\").replace(/"/g, '\\$&').replace(/\u000a/g, '\\n').replace(/\u000d/g, '');
    }
    isNotLiteral(str) {
        return RE.Namespace.test(str) || str.startsWith('<http') || RE.contentInRoundBrackets.test(str) || RE.contentInSquareBrackets.test(str);
    }
}
app.specif2turtle = (specifData, opts) => {
    const sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '#'), ontURI = pigOnto + '#', extendedClasses = LIB.getExtendedClasses(specifData.resourceClasses, 'all')
        .concat(LIB.getExtendedClasses(specifData.statementClasses, 'all'));
    let toRdf = new CToRdf();
    let ttl = defineNamespaces()
        + xProjectMetadata(specifData)
        + declarePigClasses()
        + xDatatypes(specifData.dataTypes)
        + xPropertyClasses(specifData.propertyClasses)
        + xResourceClasses(specifData.resourceClasses)
        + xStatementClasses(specifData.statementClasses)
        + xResources(specifData.resources)
        + xStatements(specifData.statements)
        + xHierarchies(specifData.nodes)
        + toRdf.newLine();
    console.debug('rdf.ttl', ttl);
    return ttl;
    function defineNamespaces() {
        let pfxL = '';
        for (var [tag, val] of app.ontology.namespaces) {
            pfxL += toRdf.prefix(tag.replace('.', ':'), val.url);
        }
        ;
        if (LIB.isArrayWithContent(nsShapes))
            for (var ns of nsShapes) {
                if (!ns.endsWith(':')) {
                    ns += ':';
                    console.warn('specif2turtle: Added a colon to namespace prefix:', ns);
                }
                ;
                pfxL += toRdf.prefix(pfx_shape + ns, pigOnto + '/shapes/' + ns + '#');
            }
        ;
        pfxL += toRdf.newLine()
            + toRdf.prefix(nsOnto, ontURI)
            + toRdf.prefix(nsData, sourceURI);
        return pfxL;
    }
    ;
    function xProjectMetadata(project) {
        let { id, title, description, $schema, generator, generatorVersion, rights, createdAt, createdBy } = project;
        let ttlStr = toRdf.heading('Project Metadata')
            + toRdf.newLine()
            + toRdf.tab0(nsData)
            + toRdf.tab1(RdfProperty.type, 'owl:Ontology')
            + toRdf.tab1(RdfProperty.label, title)
            + toRdf.tab1(RdfProperty.comment, description)
            + toRdf.tab1('owl:imports', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#>')
            + toRdf.tab2('<http://www.w3.org/2000/01/rdf-schema#>')
            + (rights ? (toRdf.tab1(DcProperty.license, '<' + rights.url + '>')) : '')
            + (createdBy ? (toRdf.tab1(DcProperty.creator, '<mailto:' + createdBy.email + '>')) : '')
            + toRdf.tab1(DcProperty.modified, createdAt);
        return ttlStr;
    }
    ;
    function xDatatypes(dTs) {
        if (!LIB.isArrayWithContent(dTs))
            return '';
        function hasDatatypeWithEnumeration() {
            for (let dT of dTs)
                if (LIB.isArrayWithContent(dT.enumeration))
                    return true;
        }
        if (!hasDatatypeWithEnumeration())
            return '';
        let ttlStr = toRdf.heading('Data Types with Enumerated Values');
        dTs.forEach(dT => {
            const dtId = LIB.makeIdWithNamespace(nsOnto, dT.id);
            if (LIB.isArrayWithContent(dT.enumeration)) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(dtId)
                    + toRdf.tab1(RdfProperty.type, 'owl:Class')
                    + toRdf.tab1(RdfProperty.label, dT.title)
                    + toRdf.tab1(RdfProperty.comment, dT.description)
                    + toRdf.tab1('owl:oneOf', toRdf.makeRdflList(nsOnto, dT.enumeration.map(itm => itm.id)));
                dT.enumeration.forEach(item => {
                    const vId = LIB.makeIdWithNamespace(nsOnto, item.id);
                    ttlStr += toRdf.tab0(vId)
                        + toRdf.tab1(RdfProperty.type, dtId)
                        + toRdf.tab1(RdfProperty.label, item.value);
                });
            }
            ;
        });
        return ttlStr;
    }
    ;
    function xPropertyClasses(pCs) {
        if (!LIB.isArrayWithContent(pCs))
            return '';
        let ttlStr = toRdf.heading('Ontology - Property Classes');
        pCs.forEach(pC => {
            const dT = LIB.itemByKey(specifData.dataTypes, pC.dataType), pcId = LIB.makeIdWithNamespace(nsOnto, pC.id);
            if (excludeProperties.includes(pcId) || isRdfImplicit(pcId))
                ttlStr += toRdf.newLine()
                    + toRdf.newLine('# Skipping implicit property: ' + pcId);
            else {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(pcId)
                    + toRdf.tab1(RdfProperty.type, dT.enumeration ? "owl:ObjectProperty" : "owl:DatatypeProperty")
                    + toRdf.tab1(RdfProperty.label, pC.title)
                    + toRdf.tab1(RdfProperty.comment, pC.description)
                    + toRdf.tab1(RdfProperty.range, dT.enumeration ? LIB.makeIdWithNamespace(nsOnto, dT.id) : undefined);
                const dt = dT.type;
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(makeShapeId(pcId))
                    + toRdf.tab1(RdfProperty.type, ShaclProperty.propertyShape)
                    + toRdf.tab1(ShaclProperty.path, pcId)
                    + toRdf.tab1(ShaclProperty.minCount, pC.required ? 1 : undefined)
                    + toRdf.tab1(ShaclProperty.maxCount, pC.multiple ? undefined : 1);
                if (dT.enumeration)
                    ttlStr += toRdf.tab1(ShaclProperty.class, LIB.makeIdWithNamespace(nsOnto, dT.id));
                else {
                    ttlStr += toRdf.tab1(ShaclProperty.datatype, dt)
                        + toRdf.tab1(ShaclProperty.maxLength, dT.maxLength)
                        + toRdf.tab1(ShaclProperty.minInclusive, dT.minInclusive)
                        + toRdf.tab1(ShaclProperty.maxInclusive, dT.maxInclusive)
                        + toRdf.tab1(ShaclProperty.pattern, dT.fractionDigits ? `^\\d+(\\\\.\\\\d{0,${dT.fractionDigits}})?$` : undefined);
                }
                ;
            }
            ;
        });
        return ttlStr;
    }
    ;
    function makeClassShape(eC) {
        const ecId = LIB.makeIdWithNamespace(nsOnto, eC.id);
        let ttlStr = toRdf.newLine()
            + toRdf.tab0(makeShapeId(ecId))
            + toRdf.tab1(RdfProperty.type, ShaclProperty.nodeShape)
            + toRdf.tab1(ShaclProperty.targetClass, ecId);
        if (LIB.isArrayWithContent(eC.propertyClasses)) {
            const fL = eC.propertyClasses.filter(pc => !isPigNative(pc.id));
            fL.forEach((pC, i) => {
                ttlStr += i < 1 ?
                    toRdf.tab1(ShaclProperty.property, makeShapeId(LIB.makeIdWithNamespace(nsOnto, pC.id)))
                    : toRdf.tab2(makeShapeId(LIB.makeIdWithNamespace(nsOnto, pC.id)));
            });
        }
        ;
        return ttlStr;
    }
    function xResourceClasses(rCL) {
        if (!LIB.isArrayWithContent(rCL))
            return '';
        let ttlStr = toRdf.heading('Ontology - Entity Classes');
        rCL.forEach(rC => {
            if (excludeEntities.includes(rC.id) || isRdfImplicit(rC.id)) {
                return;
            }
            ;
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(rC)), entId = LIB.makeIdWithNamespace(nsOnto, rC.id), ity = app.ontology.organizerClasses.includes(entId) ? PigItemType.Organizer : PigItemType.Entity;
            ttlStr += toRdf.newLine()
                + toRdf.tab0(entId)
                + toRdf.tab1(RdfProperty.subClassOf, (rC.extends ? LIB.makeIdWithNamespace(nsOnto, rC.extends.id) : ity))
                + toRdf.tab1(RdfProperty.label, rC.title)
                + toRdf.tab1(RdfProperty.comment, rC.description)
                + toRdf.tab1(PigProperty.icon, rC.icon);
            ttlStr += makeClassShape(exC);
        });
        return ttlStr;
    }
    ;
    function xStatementClasses(sCL) {
        if (!LIB.isArrayWithContent(sCL))
            return '';
        let ttlStr = toRdf.heading('Ontology - Relationship Classes');
        sCL.forEach(sC => {
            if (excludeRelationships.includes(sC.id) || isRdfImplicit(sC.id) || diagramRels.includes(sC.id)) {
                return;
            }
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(sC)), relId = LIB.makeIdWithNamespace(nsOnto, sC.id);
            ttlStr += toRdf.newLine()
                + toRdf.tab0(relId)
                + toRdf.tab1(RdfProperty.subClassOf, (sC.extends ? LIB.makeIdWithNamespace(nsOnto, sC.extends.id) : PigItemType.Relationship))
                + toRdf.tab1(RdfProperty.label, sC.title)
                + toRdf.tab1(RdfProperty.comment, sC.description)
                + toRdf.tab1(PigProperty.icon, sC.icon)
                + toRdf.newLine()
                + toRdf.tab0(relId + suffixHasSrc)
                + toRdf.tab1(RdfProperty.subPropertyOf, PigProperty.eligibleSource)
                + toRdf.tab1(RdfProperty.comment, "Connects the source of " + relId)
                + toRdf.tab1(RdfProperty.domain, relId)
                + toRdf.tab1(RdfProperty.range, toRdf.makeOwlUnion(nsOnto, sC.subjectClasses))
                + toRdf.newLine()
                + toRdf.tab0(relId + suffixHasTrg)
                + toRdf.tab1(RdfProperty.subPropertyOf, PigProperty.eligibleTarget)
                + toRdf.tab1(RdfProperty.comment, "Connects the target of " + relId)
                + toRdf.tab1(RdfProperty.domain, relId)
                + toRdf.tab1(RdfProperty.range, toRdf.makeOwlUnion(nsOnto, sC.objectClasses))
                + makeClassShape(exC)
                + toRdf.tab1(ShaclProperty.property, toRdf.makeShaclList([
                    { prd: ShaclProperty.path, obj: relId + suffixHasSrc },
                    { prd: ShaclProperty.or, obj: toRdf.makeShaclOr(nsOnto, ShaclProperty.class, sC.subjectClasses) },
                    { prd: ShaclProperty.minCount, obj: '1' },
                    { prd: ShaclProperty.maxCount, obj: '1' }
                ]))
                + toRdf.tab1(ShaclProperty.property, toRdf.makeShaclList([
                    { prd: ShaclProperty.path, obj: relId + suffixHasTrg },
                    { prd: ShaclProperty.or, obj: toRdf.makeShaclOr(nsOnto, ShaclProperty.class, sC.objectClasses) },
                    { prd: ShaclProperty.minCount, obj: '1' },
                    { prd: ShaclProperty.maxCount, obj: '1' }
                ]));
        });
        return ttlStr;
    }
    ;
    function xProperties(el) {
        let ttlStr = '';
        if (LIB.isArrayWithContent(el.properties)) {
            el.properties.forEach(p => {
                if (p.values.length > 0) {
                    let pred = LIB.makeIdWithNamespace(nsOnto, p['class'].id);
                    if (p.values[0].id) {
                        ttlStr += toRdf.tab1(pred, p.values.map(v => LIB.makeIdWithNamespace(nsOnto, v.id)));
                    }
                    else {
                        if (p.values.length > 1) {
                            console.warn('specif2turtle: Only the first value of a property is transformed:', p);
                        }
                        ;
                        ttlStr += toRdf.tab1(pred, p.values[0]);
                    }
                    ;
                }
                ;
            });
        }
        ;
        return ttlStr;
    }
    ;
    function xAnElement(r) {
        return toRdf.newLine()
            + toRdf.tab0(nsData + r.id)
            + toRdf.tab1(RdfProperty.type, LIB.makeIdWithNamespace(nsOnto, r['class'].id))
            + xProperties(r)
            + toRdf.tab1("pig:revision", r.revision)
            + toRdf.tab1("pig:priorRevision", r.replaces)
            + toRdf.tab1(DcProperty.modified, r.changedAt)
            + toRdf.tab1(DcProperty.creator, r.changedBy);
    }
    function xResources(rL) {
        if (LIB.isArrayWithContent(rL)) {
            let ttlStr = toRdf.heading('Entities');
            rL.forEach(r => {
                if (!hierarchyItems.includes(r['class'].id)) {
                    ttlStr += xAnElement(r);
                    switch (r['class'].id) {
                        case 'pig:View':
                            let sL = specifData.statements.filter(s => {
                                return s['class'].id.includes(':shows') && s.subject.id == r.id;
                            });
                            if (sL.length > 0) {
                                let L = sL.map(s => LIB.makeIdWithNamespace(nsData, s.object.id));
                                ttlStr += toRdf.tab1(PigProperty.shows, toRdf.makeRdflList(nsData, L));
                            }
                            ;
                            sL = specifData.statements.filter(s => {
                                return s['class'].id.includes(':ownedDiagram') && s.object.id == r.id;
                            });
                            if (sL.length > 0) {
                                let L = sL.map(s => LIB.makeIdWithNamespace(nsData, s.subject.id));
                                ttlStr += toRdf.tab1(PigProperty.depicts, toRdf.makeRdflList(nsData, L));
                            }
                            ;
                    }
                    ;
                }
                ;
            });
            return ttlStr;
        }
        ;
        return '';
    }
    ;
    function xStatements(sL) {
        if (LIB.isArrayWithContent(sL)) {
            let ttlStr = toRdf.heading('Relationships');
            sL.forEach(s => {
                let sCId = LIB.makeIdWithNamespace(nsOnto, s['class'].id);
                switch (sCId) {
                    case 'SpecIF:shows':
                    case 'uml:ownedDiagram':
                        break;
                    default:
                        ttlStr += toRdf.newLine()
                            + toRdf.tab0(nsData + s.id)
                            + toRdf.tab1(RdfProperty.type, sCId)
                            + toRdf.tab1(sCId + suffixHasSrc, nsData + s.subject.id)
                            + toRdf.tab1(sCId + suffixHasTrg, nsData + s.object.id)
                            + xProperties(s)
                            + toRdf.tab1(DcProperty.modified, s.changedAt)
                            + toRdf.tab1(DcProperty.creator, s.changedBy);
                }
                ;
            });
            return ttlStr;
        }
        ;
        return '';
    }
    ;
    function xHierarchies(nodes) {
        if (LIB.isArrayWithContent(nodes)) {
            let ttlStr = toRdf.heading('Hierarchy')
                + toRdf.newLine()
                + toRdf.tab0(nsData + 'HierarchyRoot' + '-' + specifData.id)
                + toRdf.tab1(RdfProperty.type, PigItemType.HierarchyRoot)
                + toRdf.tab1(RdfProperty.label, 'Hierarchy Root')
                + toRdf.tab1(RdfProperty.comment, '... anchoring all hierarchies of this graph (package)');
            ttlStr += toRdf.tab1(PigProperty.lists, toRdf.makeRdflList(nsData, nodes.map(nd => nd.resource.id)));
            LIB.iterateSpecifNodes(nodes, (tree) => {
                const r = LIB.itemById(specifData.resources, tree.resource.id);
                if (hierarchyItems.includes(r['class'].id)) {
                    ttlStr += xAnElement(r);
                    if (LIB.isArrayWithContent(tree.nodes)) {
                        ttlStr += toRdf.tab1(PigProperty.lists, toRdf.makeRdflList(nsData, tree.nodes.map(nd => nd.resource.id)));
                    }
                    ;
                }
                ;
                return true;
            });
            return ttlStr;
        }
        return '';
    }
    ;
    function declarePigClasses() {
        let ttlStr = toRdf.heading('PIG Metamodel (pig:)');
        pigEntities.concat(pigRelationships).forEach(c => {
            ttlStr += toRdf.newLine()
                + toRdf.tab0(c[0])
                + toRdf.tab1(c[1].startsWith("owl:") ? RdfProperty.type : RdfProperty.subClassOf, c[1])
                + toRdf.tab1(RdfProperty.label, c[2])
                + toRdf.tab1(RdfProperty.comment, c[3])
                + toRdf.newLine()
                + toRdf.tab0(pfx_shape + c[0])
                + toRdf.tab1(RdfProperty.type, ShaclProperty.nodeShape)
                + toRdf.tab1(ShaclProperty.property, LIB.isArrayWithContent(c[4]) ? c[4].map(p => pfx_shape + p) : undefined)
                + toRdf.tab1(ShaclProperty.targetClass, c[0]);
        });
        pigProperties.concat(pigReferences).forEach(c => {
            ttlStr += toRdf.newLine()
                + toRdf.tab0(c[0])
                + toRdf.tab1(c[1].startsWith("owl:") || c[1].startsWith("rdf:") ? RdfProperty.type : RdfProperty.subPropertyOf, c[1])
                + toRdf.tab1(RdfProperty.range, toRdf.makeOwlUnion(nsOnto, c[3]))
                + toRdf.tab1(RdfProperty.label, c[4])
                + toRdf.tab1(RdfProperty.comment, c[5])
                + toRdf.newLine()
                + toRdf.tab0(pfx_shape + c[0])
                + toRdf.tab1(RdfProperty.type, ShaclProperty.propertyShape)
                + toRdf.tab1(ShaclProperty.path, c[0]);
            if (Array.isArray(c[3]) && c[3].length > 0 && c[3][0].startsWith(pfx_datatype)) {
                ttlStr += toRdf.tab1(ShaclProperty.datatype, c[3][0]);
                ttlStr += toRdf.tab1(ShaclProperty.maxLength, c[6]);
                ttlStr += toRdf.tab1(ShaclProperty.minCount, c[7]);
                ttlStr += toRdf.tab1(ShaclProperty.maxCount, c[8]);
            }
            else
                ttlStr += toRdf.tab1(ShaclProperty.or, toRdf.makeShaclOr(nsOnto, ShaclProperty.class, c[3]));
        });
        return ttlStr;
    }
};
