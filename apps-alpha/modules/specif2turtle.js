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
const PigItemType = {
    Property: `${CONFIG.pfxNsMeta}Property`,
    aProperty: `${CONFIG.pfxNsMeta}aProperty`,
    Link: `${CONFIG.pfxNsMeta}Link`,
    aSourceLink: `${CONFIG.pfxNsMeta}aSourceLink`,
    aTargetLink: `${CONFIG.pfxNsMeta}aTargetLink`,
    Element: `${CONFIG.pfxNsMeta}Element`,
    Entity: `${CONFIG.pfxNsMeta}Entity`,
    anEntity: `${CONFIG.pfxNsMeta}anEntity`,
    Relationship: `${CONFIG.pfxNsMeta}Relationship`,
    aRelationship: `${CONFIG.pfxNsMeta}aRelationship`,
    Package: `${CONFIG.pfxNsMeta}Package`,
    aPackage: `${CONFIG.pfxNsMeta}aPackage`,
    Ontology: `${CONFIG.pfxNsMeta}Ontology`,
    anOntology: `${CONFIG.pfxNsMeta}anOntology`,
    Artifact: `${CONFIG.pfxNsSemi}Artifact`,
    Actor: `FMC:Actor`,
    State: `FMC:State`,
    Event: `FMC:Event`,
    Organizer: `${CONFIG.pfxNsSemi}Organizer`,
    anOrganizer: `${CONFIG.pfxNsSemi}anOrganizer`,
    Root: `${CONFIG.pfxNsSemi}Root`,
    Tree: `${CONFIG.pfxNsSemi}Tree`,
    Outline: `${CONFIG.pfxNsSemi}Outline`,
    Table: `${CONFIG.pfxNsSemi}Table`,
    View: `${CONFIG.pfxNsSemi}View`,
    Enumeration: `${CONFIG.pfxNsSemi}Enumeration`
};
const PigProperty = {
    itemType: `${CONFIG.pfxNsMeta}itemType`,
    enumeratedValue: `${CONFIG.pfxNsMeta}enumeratedValue`,
    SourceLink: `${CONFIG.pfxNsMeta}SourceLink`,
    TargetLink: `${CONFIG.pfxNsMeta}TargetLink`,
    enumeratedEndpoint: `${CONFIG.pfxNsMeta}enumeratedEndpoint`,
    enumeratedProperty: `${CONFIG.pfxNsMeta}enumeratedProperty`,
    enumeratedSourceLink: `${CONFIG.pfxNsMeta}enumeratedSourceLink`,
    enumeratedTargetLink: `${CONFIG.pfxNsMeta}enumeratedTargetLink`,
    hasSourceLink: `${CONFIG.pfxNsMeta}hasSourceLink`,
    hasTargetLink: `${CONFIG.pfxNsMeta}hasTargetLink`,
    specializes: `${CONFIG.pfxNsMeta}specializes`,
    revision: `${CONFIG.pfxNsMeta}revision`,
    priorRevision: `${CONFIG.pfxNsMeta}priorRevision`,
    lists: `${CONFIG.pfxNsSemi}lists`,
    shows: `${CONFIG.pfxNsSemi}shows`,
    depicts: `${CONFIG.pfxNsSemi}depicts`,
    icon: `${CONFIG.pfxNsMeta}Icon`,
    category: `${CONFIG.pfxNsSemi}Category`,
    diagram: `${CONFIG.pfxNsSemi}Diagram`,
    notation: `${CONFIG.pfxNsSemi}Notation`
};
const DcProperty = {
    title: `${CONFIG.pfxNsDcmi}title`,
    description: `${CONFIG.pfxNsDcmi}description`,
    definition: `skos:definition`,
    type: `${CONFIG.pfxNsDcmi}type`,
    modified: `${CONFIG.pfxNsDcmi}modified`,
    creator: `${CONFIG.pfxNsDcmi}creator`,
    license: `${CONFIG.pfxNsDcmi}license`
};
const RdfProperty = {
    type: 'rdf:type',
    label: 'rdfs:label',
    comment: 'rdfs:comment',
    subClassOf: 'rdfs:subClassOf',
    subPropertyOf: 'rdfs:subPropertyOf',
    domain: 'rdfs:domain',
    range: 'rdfs:range'
};
const ShaclProperty = {
    nodeShape: 'sh:NodeShape',
    propertyShape: 'sh:PropertyShape',
    targetClass: 'sh:targetClass',
    property: 'sh:property',
    path: 'sh:path',
    class: 'sh:class',
    datatype: 'sh:datatype',
    maxLength: 'sh:maxLength',
    minInclusive: 'sh:minInclusive',
    maxInclusive: 'sh:maxInclusive',
    minCount: 'sh:minCount',
    maxCount: 'sh:maxCount',
    pattern: 'sh:pattern',
    or: 'sh:or'
};
const nsData = 'd:', nsOnto = "o:", sfx_toSrc = "-toSource", sfx_toTrg = "-toTarget", pfx_datatype = 'xs:', pfx_shape = `${CONFIG.pfxNsMeta.slice(0, -1)}Shapes_`, sfx_shape = "_shape", pigOnto = 'https://product-information-graph.org/v0.2/ontology';
const pigEntities = [
    [PigItemType.Entity, undefined, 'Entity', 'A CASCaRA meta-model item used for entities (aka resources or artifacts).', [PigProperty.category, PigProperty.icon], []],
    [PigItemType.Package, PigItemType.Entity, 'Package', 'A CASCaRA meta-model item used for packages comprising entities, relationships and potentially nested packages.', [], []],
    [PigItemType.Artifact, PigItemType.Entity, 'Artifact', 'The most generic class for all model entities (e.g. requirement, function, system, component, state, event, ...).', [], []],
    [PigItemType.Actor, PigItemType.Artifact, 'Actor', 'A fundamental model-element class for actors (e.g. users, functions, systems, components, ...).', [], []],
    [PigItemType.State, PigItemType.Artifact, 'State', 'A fundamental model-element class for states (e.g. system or process states, information, form, color, ...).', [], []],
    [PigItemType.Event, PigItemType.Artifact, 'Event', 'A fundamental model-element class for events (e.g. environmental or process events, ...).', [], []],
    [PigItemType.Organizer, PigItemType.Entity, 'Organizer', `A class for organizing model-elements. An example is a list of requirements or a diagram using a certain notation.`, [], []],
    [PigItemType.Root, PigItemType.Organizer, 'Root', `A subclass of ${PigItemType.Organizer} serving as a root for trees and tables.`, [], [PigProperty.lists]],
    [PigItemType.Tree, PigItemType.Organizer, 'Tree', `A subclass of ${PigItemType.Organizer} for strictly hierarchical data structures referencing entities and relationships.`, [], [PigProperty.lists]],
    [PigItemType.Outline, PigItemType.Tree, 'Outline', `A subclass of ${PigItemType.Tree} comprising all information items of a human-readable document. As usual, the outline is hierarchically organized.`, [], []],
    [PigItemType.View, PigItemType.Organizer, 'View', `A subclass of ${PigItemType.Organizer} representing a model view (diagram) using a certain notation showing selected model elements.`, [PigProperty.diagram, PigProperty.notation], [PigProperty.shows, PigProperty.depicts]],
    [PigItemType.Table, PigItemType.Organizer, 'Table', `A subclass of ${PigItemType.Organizer} representing a table showing selected model elements.`, [], [PigProperty.shows]],
    [PigItemType.Enumeration, undefined, 'Enumeration', 'A CASCaRA meta-model item used for enumerations of values.', [], []]
], pigRelationships = [
    [PigItemType.Relationship, undefined, 'Relationship', 'A CASCaRA meta-model item used for reified relationships (aka predicates).', [PigProperty.category, PigProperty.icon], PigProperty.SourceLink, PigProperty.TargetLink],
], pigProperties = [
    [PigItemType.Property, undefined, [PigItemType.Entity, PigItemType.Relationship], 'xs:anyType', 'Property', 'A CASCaRA meta-model item used for properties (aka attributes).', undefined, undefined, undefined],
    [PigProperty.icon, PigItemType.Property, [PigItemType.Entity, PigItemType.Relationship], XsDataType.String, 'has icon', 'Specifies an icon for a model element (entity or relationship).', undefined, 0, 1],
    [PigProperty.diagram, PigItemType.Property, [PigItemType.View], XsDataType.String, 'Diagram', 'A diagram illustrating the resource or a link to a diagram.', undefined, 0, undefined],
    [PigProperty.category, PigItemType.Property, [PigItemType.Entity, PigItemType.Relationship], XsDataType.String, 'has category', 'Specifies a category for an element (entity, relationship or organizer).', 32, 0, 1],
    [PigProperty.notation, PigProperty.category, [PigItemType.View], XsDataType.String, 'Notation', 'A reference to a notation defining the syntax and semantics of a diagram.', undefined, 0, 1]
], pigLinks = [
    [PigItemType.Link, undefined, [PigItemType.Organizer, PigItemType.Relationship], [PigItemType.Entity, PigItemType.Relationship], 'linked with', 'A PIG meta-model item connecting a reified relationship with its source or target. Also connects an organizer to a model element.'],
    [PigProperty.SourceLink, PigItemType.Link, [PigItemType.Relationship], [PigItemType.Entity, PigItemType.Relationship], 'to source', 'Connects the source of a reified relationship.'],
    [PigProperty.TargetLink, PigItemType.Link, [PigItemType.Relationship], [PigItemType.Entity, PigItemType.Relationship], 'to target', 'Connects the target of a reified relationship or an organizer.'],
    [PigProperty.lists, PigProperty.TargetLink, [PigItemType.Root, PigItemType.Tree], [PigItemType.Entity, PigItemType.Relationship, PigItemType.Organizer], 'lists', 'Lists an entity, a relationship or a subordinated organizer.'],
    [PigProperty.shows, PigProperty.TargetLink, [PigItemType.View], [PigItemType.Entity, PigItemType.Relationship], 'shows', 'Shows an entity or a relationship.'],
    [PigProperty.depicts, PigProperty.TargetLink, [PigItemType.View], [PigItemType.Entity], 'depicts', 'Depicts an entity; inverse of uml:ownedDiagram.']
], pigNativeProperties = [DcProperty.title, DcProperty.description, DcProperty.definition], diagramRels = ['SpecIF:shows', 'uml:ownedDiagram'], hierarchyItems = [CONFIG.resClassFolder, CONFIG.resClassOutline, CONFIG.resClassGlossary], excludeEntities = [PigItemType.Element].concat(pigEntities.map(en => en[0])), excludeRelationships = pigRelationships.map(rel => rel[0]), excludeProperties = pigProperties.concat(pigLinks).map(pr => pr[0]);
function isEstablishedNs(id) {
    const establishedNs = ['rdf', 'rdfs', 'owl', 'skos', 'sh', 'xs', 'xsd', CONFIG.pfxNsDcmi.slice(0, -1)];
    return establishedNs.includes(id.split(':')[0]);
}
function isPigNative(str) {
    return pigNativeProperties.includes(str);
}
function makeShapeId(id) {
    return id.startsWith(nsOnto) ? id + sfx_shape : pfx_shape + id;
}
function collectNamespaces(specifData) {
    const usedPrefixes = new Set();
    usedPrefixes.add('rdf:');
    usedPrefixes.add('rdfs:');
    usedPrefixes.add('sh:');
    usedPrefixes.add('owl:');
    usedPrefixes.add('skos:');
    usedPrefixes.add(CONFIG.pfxNsDcmi);
    usedPrefixes.add(CONFIG.pfxNsMeta);
    usedPrefixes.add(`${pfx_shape}${CONFIG.pfxNsMeta}`);
    if (CONFIG.pfxNsMeta != CONFIG.pfxNsSemi) {
        usedPrefixes.add(CONFIG.pfxNsSemi);
        usedPrefixes.add(`${pfx_shape}${CONFIG.pfxNsSemi}`);
    }
    usedPrefixes.add('FMC:');
    usedPrefixes.add(`${pfx_shape}FMC:`);
    function addPrefix(id) {
        if (!id)
            return;
        const match = id.match(/^([\w-]+)(:|\.)/);
        if (match)
            usedPrefixes.add(`${match[1]}:`);
    }
    [
        specifData.dataTypes,
        specifData.propertyClasses,
        specifData.resourceClasses,
        specifData.statementClasses,
        specifData.resources,
        specifData.statements
    ].forEach(list => {
        if (Array.isArray(list)) {
            list.forEach((item) => {
                addPrefix(item.id);
                addPrefix(item.type);
                addPrefix(item['class']?.id);
                addPrefix(item.dataType?.id);
                addPrefix(item.extends?.id);
                if (Array.isArray(item.propertyClasses)) {
                    item.propertyClasses.forEach((pc) => addPrefix(pc.id));
                }
                ['subjectClasses', 'objectClasses'].forEach(prop => {
                    if (Array.isArray(item[prop])) {
                        item[prop].forEach((k) => addPrefix(k.id));
                    }
                });
                if (Array.isArray(item.properties)) {
                    item.properties.forEach((prp) => {
                        let v = LIB.isMultiLanguageValue(prp.values[0]) ? LIB.languageTextOf(prp.values[0], { targetLanguage: 'default' }) : undefined;
                        return addPrefix(v);
                    });
                }
                ;
                if (Array.isArray(item.enumeration)) {
                    item.enumeration.forEach((enV) => addPrefix(enV.id));
                }
            });
        }
    });
    return usedPrefixes;
}
class CToRdf {
    constructor() {
        this.lastTab = -1;
    }
    heading(str) {
        return this.newLine()
            + this.newLine('#################################################################')
            + this.newLine(`# ${str}`)
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
    makeLines(pred, object) {
        function noQuotes(str) {
            return (RE.NamespaceRDF.test(str) || str.startsWith('<http') || RE.contentInRoundBrackets.test(str) || RE.contentInSquareBrackets.test(str))
                && !pred.includes('rdfs:label') && !pred.includes('rdfs:comment');
        }
        switch (typeof (object)) {
            case 'undefined':
                return "";
            case 'number':
            case 'boolean':
                object = object.toString();
            case 'string':
                if (object.length > 0) {
                    if (noQuotes(object))
                        return pred + object;
                    else
                        return pred + `"${this.escapeTtl(object)}"`;
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
                        if (noQuotes(t))
                            return pred + `${t}`;
                        let languageTag = l ? `@${l}` : '';
                        return pred + `"${this.escapeTtl(t)}"` + languageTag;
                    }
                    ;
                    let str = "";
                    object.forEach((v, i) => {
                        if (!v.language)
                            console.error("specif2turtle: Multilanguage text must have a language specified if there are multiple language versions:", v);
                        str += (i == 0 ? pred : " ,\n\t\t") + `"${this.escapeTtl(v['text'])}"@${v.language}`;
                    });
                    return str;
                }
                else {
                    let str = '';
                    object.forEach((v, i) => {
                        str += (i == 0 ? pred : " ,\n\t\t") + (noQuotes(v) ? v : `"${v}"`);
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
}
app.specif2turtle = (specifData, options) => {
    const opts = {
        withOwlClasses: true,
        ...options
    };
    const date = new Date().toISOString(), sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '#'), ontURI = pigOnto + '#', extendedClasses = LIB.getExtendedClasses(specifData.resourceClasses, 'all')
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
        const usedPrefixes = collectNamespaces(specifData);
        let pfxL = '';
        for (let [tag, val] of app.ontology.namespaces) {
            const cleanTag = tag.replace(/[\.]$/, ':');
            if (usedPrefixes.has(cleanTag)) {
                pfxL += toRdf.prefix(cleanTag, val.url);
                if (!isEstablishedNs(cleanTag))
                    pfxL += toRdf.prefix(`${pfx_shape}${cleanTag}`, `${pigOnto}/shapes/${cleanTag.slice(0, -1)}#`);
            }
        }
        pfxL += toRdf.newLine()
            + toRdf.prefix(nsOnto, ontURI)
            + toRdf.prefix(nsData, sourceURI);
        return pfxL;
    }
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
                    + (opts.withOwlClasses ? toRdf.tab1(RdfProperty.type, 'owl:Class') : '')
                    + toRdf.tab1(RdfProperty.subClassOf, PigItemType.Enumeration)
                    + toRdf.tab1(RdfProperty.label, dT.title)
                    + toRdf.tab1(DcProperty.definition, dT.description)
                    + toRdf.tab1(DcProperty.modified, dT.changedAt)
                    + toRdf.tab1(DcProperty.creator, dT.changedBy)
                    + toRdf.tab1(ShaclProperty.datatype, dT.type)
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
            if (excludeProperties.includes(pcId) || isEstablishedNs(pcId))
                ttlStr += toRdf.newLine()
                    + toRdf.newLine('# Skipping implicit property: ' + pcId);
            else {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(pcId)
                    + (dT.enumeration ?
                        ((opts.withOwlClasses ? toRdf.tab1(RdfProperty.type, "owl:ObjectProperty") : '')
                            + toRdf.tab1(RdfProperty.subPropertyOf, `${CONFIG.pfxNsMeta}Link`))
                        : ((opts.withOwlClasses ? toRdf.tab1(RdfProperty.type, "owl:DatatypeProperty") : '')
                            + toRdf.tab1(RdfProperty.subPropertyOf, `${CONFIG.pfxNsMeta}Property`)))
                    + toRdf.tab1(RdfProperty.label, pC.title)
                    + toRdf.tab1(DcProperty.definition, pC.description)
                    + toRdf.tab1(RdfProperty.range, dT.enumeration ? LIB.makeIdWithNamespace(nsOnto, dT.id) : undefined);
                +toRdf.tab1(DcProperty.modified, pC.changedAt)
                    + toRdf.tab1(DcProperty.creator, pC.changedBy);
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(makeShapeId(pcId))
                    + toRdf.tab1(RdfProperty.type, ShaclProperty.propertyShape)
                    + toRdf.tab1(ShaclProperty.path, pcId)
                    + toRdf.tab1(ShaclProperty.minCount, pC.required ? 1 : undefined)
                    + toRdf.tab1(ShaclProperty.maxCount, pC.multiple ? undefined : 1);
                if (dT.enumeration)
                    ttlStr += toRdf.tab1(ShaclProperty.class, LIB.makeIdWithNamespace(nsOnto, dT.id));
                else {
                    ttlStr += toRdf.tab1(ShaclProperty.datatype, dT.type)
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
            const fL = eC.propertyClasses.filter(pc => !isPigNative(pc.id)).map(pc => (LIB.makeIdWithNamespace(nsOnto, pc.id)));
            ttlStr += toRdf.tab1(ShaclProperty.property, fL.map(mapShPrp));
        }
        ;
        return ttlStr;
    }
    function xResourceClasses(rCL) {
        if (!LIB.isArrayWithContent(rCL))
            return '';
        let ttlStr = toRdf.heading('Ontology - Entity Classes');
        rCL.forEach(rC => {
            if (excludeEntities.includes(rC.id) || isEstablishedNs(rC.id)) {
                return;
            }
            ;
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(rC)), entId = LIB.makeIdWithNamespace(nsOnto, rC.id), ity = app.ontology.organizerClasses.includes(entId) ? PigItemType.Organizer : PigItemType.Artifact;
            ttlStr += toRdf.newLine()
                + toRdf.tab0(entId)
                + (opts.withOwlClasses ? toRdf.tab1(RdfProperty.type, 'owl:Class') : '')
                + toRdf.tab1(RdfProperty.subClassOf, (rC.extends ? LIB.makeIdWithNamespace(nsOnto, rC.extends.id) : ity))
                + toRdf.tab1(RdfProperty.label, rC.title)
                + toRdf.tab1(DcProperty.definition, rC.description)
                + toRdf.tab1(PigProperty.icon, rC.icon);
            +toRdf.tab1(DcProperty.modified, rC.changedAt)
                + toRdf.tab1(DcProperty.creator, rC.changedBy);
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
            if (excludeRelationships.includes(sC.id) || isEstablishedNs(sC.id) || diagramRels.includes(sC.id)) {
                return;
            }
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(sC)), relId = LIB.makeIdWithNamespace(nsOnto, sC.id);
            ttlStr += toRdf.newLine()
                + toRdf.tab0(relId)
                + (opts.withOwlClasses ? toRdf.tab1(RdfProperty.type, 'owl:Class') : '')
                + toRdf.tab1(RdfProperty.subClassOf, (sC.extends ? LIB.makeIdWithNamespace(nsOnto, sC.extends.id) : PigItemType.Relationship))
                + toRdf.tab1(RdfProperty.label, sC.title)
                + toRdf.tab1(DcProperty.definition, sC.description)
                + toRdf.tab1(PigProperty.icon, sC.icon)
                + toRdf.tab1(DcProperty.modified, sC.changedAt)
                + toRdf.tab1(DcProperty.creator, sC.changedBy)
                + toRdf.newLine()
                + toRdf.tab0(relId + sfx_toSrc)
                + toRdf.tab1(RdfProperty.subPropertyOf, PigProperty.SourceLink)
                + toRdf.tab1(RdfProperty.label, relId + " to source")
                + toRdf.tab1(RdfProperty.comment, "Connects the source of " + relId)
                + toRdf.tab1(RdfProperty.domain, relId)
                + toRdf.tab1(RdfProperty.range, toRdf.makeOwlUnion(nsOnto, sC.subjectClasses))
                + toRdf.newLine()
                + toRdf.tab0(relId + sfx_toTrg)
                + toRdf.tab1(RdfProperty.subPropertyOf, PigProperty.TargetLink)
                + toRdf.tab1(RdfProperty.label, relId + " to target")
                + toRdf.tab1(RdfProperty.comment, "Connects the target of " + relId)
                + toRdf.tab1(RdfProperty.domain, relId)
                + toRdf.tab1(RdfProperty.range, toRdf.makeOwlUnion(nsOnto, sC.objectClasses))
                + makeClassShape(exC)
                + toRdf.tab1(ShaclProperty.property, toRdf.makeShaclList([
                    { prd: ShaclProperty.path, obj: relId + sfx_toSrc },
                    { prd: ShaclProperty.or, obj: toRdf.makeShaclOr(nsOnto, ShaclProperty.class, sC.subjectClasses) },
                    { prd: ShaclProperty.minCount, obj: '1' },
                    { prd: ShaclProperty.maxCount, obj: '1' }
                ]))
                + toRdf.tab1(ShaclProperty.property, toRdf.makeShaclList([
                    { prd: ShaclProperty.path, obj: relId + sfx_toTrg },
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
            + toRdf.tab1(PigProperty.revision, r.revision)
            + toRdf.tab1(PigProperty.priorRevision, r.replaces)
            + toRdf.tab1(DcProperty.modified, r.changedAt ?? date)
            + toRdf.tab1(DcProperty.creator, r.changedBy);
    }
    function xResources(rL) {
        if (LIB.isArrayWithContent(rL)) {
            let ttlStr = toRdf.heading('Entities');
            rL.forEach(r => {
                if (!hierarchyItems.includes(r['class'].id)) {
                    ttlStr += xAnElement(r);
                    switch (r['class'].id) {
                        case PigItemType.View:
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
                            + toRdf.tab1(sCId + sfx_toSrc, nsData + s.subject.id)
                            + toRdf.tab1(sCId + sfx_toTrg, nsData + s.object.id)
                            + xProperties(s)
                            + toRdf.tab1(DcProperty.modified, s.changedAt ?? date)
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
                + toRdf.tab1(RdfProperty.type, PigItemType.Root)
                + toRdf.tab1(DcProperty.modified, date)
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
    function mapShPrp(p) {
        if (p.startsWith('rdfs')) {
            return toRdf.makeShaclList([{ prd: ShaclProperty.path, obj: p }, { prd: ShaclProperty.minCount, obj: '1' }]);
        }
        return makeShapeId(p);
    }
    function declarePigClasses() {
        let ttlStr = toRdf.heading('CASCaRA Metamodel and Semantic Infrastructure');
        pigEntities.forEach(c => {
            let prpL = [RdfProperty.label, RdfProperty.comment].concat(c[4], c[5]);
            ttlStr += toRdf.newLine()
                + toRdf.tab0(c[0])
                + toRdf.tab1(RdfProperty.type, 'owl:Class')
                + (c[1] ? toRdf.tab1(RdfProperty.subClassOf, c[1]) : '')
                + toRdf.tab1(RdfProperty.label, c[2])
                + toRdf.tab1(DcProperty.definition, c[3])
                + toRdf.newLine()
                + toRdf.tab0(pfx_shape + c[0])
                + toRdf.tab1(RdfProperty.type, ShaclProperty.nodeShape)
                + toRdf.tab1(ShaclProperty.targetClass, c[0])
                + toRdf.tab1(ShaclProperty.property, LIB.isArrayWithContent(prpL) ? prpL.map(mapShPrp) : undefined);
        });
        pigRelationships.forEach(c => {
            let prpL = [RdfProperty.label, RdfProperty.comment].concat(c[4], [c[5], c[6]]);
            ttlStr += toRdf.newLine()
                + toRdf.tab0(c[0])
                + toRdf.tab1(RdfProperty.type, 'owl:Class')
                + (c[1] ? toRdf.tab1(RdfProperty.subClassOf, c[1]) : '')
                + toRdf.tab1(RdfProperty.label, c[2])
                + toRdf.tab1(DcProperty.definition, c[3])
                + toRdf.newLine()
                + toRdf.tab0(pfx_shape + c[0])
                + toRdf.tab1(RdfProperty.type, ShaclProperty.nodeShape)
                + toRdf.tab1(ShaclProperty.targetClass, c[0])
                + toRdf.tab1(ShaclProperty.property, LIB.isArrayWithContent(prpL) ? prpL.map(mapShPrp) : undefined);
        });
        [
            { list: pigProperties, type: 'owl:DatatypeProperty' },
            { list: pigLinks, type: 'owl:ObjectProperty' }
        ].forEach(cL => {
            cL.list.forEach(c => {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(c[0])
                    + toRdf.tab1(RdfProperty.type, cL.type)
                    + (c[1] ? toRdf.tab1(RdfProperty.subPropertyOf, c[1]) : '')
                    + toRdf.tab1(RdfProperty.range, toRdf.makeOwlUnion(nsOnto, c[3]))
                    + toRdf.tab1(RdfProperty.label, c[4])
                    + toRdf.tab1(DcProperty.definition, c[5]);
                if (c[3] != undefined) {
                    ttlStr += toRdf.newLine()
                        + toRdf.tab0(pfx_shape + c[0])
                        + toRdf.tab1(RdfProperty.type, ShaclProperty.propertyShape)
                        + toRdf.tab1(ShaclProperty.path, c[0]);
                    if (typeof (c[3]) == 'string' && c[3].startsWith(pfx_datatype)) {
                        ttlStr += toRdf.tab1(ShaclProperty.datatype, c[3])
                            + toRdf.tab1(ShaclProperty.maxLength, c[6])
                            + toRdf.tab1(ShaclProperty.minCount, c[7])
                            + toRdf.tab1(ShaclProperty.maxCount, c[8]);
                    }
                    else
                        ttlStr += toRdf.tab1(ShaclProperty.or, toRdf.makeShaclOr(nsOnto, ShaclProperty.class, c[3]));
                }
            });
        });
        return ttlStr;
    }
};
