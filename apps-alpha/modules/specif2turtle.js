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
function escapeTtl(str) {
    if (str)
        return str.replace("\\", "\\\\").replace(/\u000a|\u000d/g, '').replace(/"/g, '\\$&');
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
    const self = ':', sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '/'), organizerClass = "pig:OrganizerClass", organizer = "pig:Organizer", entityClass = "pig:EntityClass", relationshipClass = "pig:RelationshipClass", icon = "pig:Icon", hasSubject = "pig:hasSubject", hasObject = "pig:hasObject", hasPart = "dcterms:hasPart", hasItem = "pig:hasElement", hasChild = "pig:hasChild", suffixShape = "-Shape", suffixHasSbj = "-hasSubject", suffixHasObj = "-hasObject";
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
                    + toRdf.tab1('rdfs:label', dT.title.replace('.', ':'), '"')
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
            let dT = LIB.itemByKey(specifData.dataTypes, pC.dataType), ti = pC.title.replace('.', ':');
            if (dT.enumeration) {
                enumPCs.push(pC.id);
                ttlStr += toRdf.newLine()
                    + toRdf.newLine("# No shape yet for propertyClass with enumerated dataType: " + pC.id)
                    + toRdf.newLine()
                    + toRdf.tab0(self + pC.id)
                    + toRdf.tab1('a', 'owl:ObjectProperty');
            }
            else {
                let dt = dT.type.replace('xs:', 'xsd:'), term = app.ontology.getTermResource('propertyClass', pC.title);
                if (term) {
                    ttlStr += toRdf.newLine()
                        + toRdf.tab0(ti)
                        + toRdf.tab1('a', 'owl:DatatypeProperty')
                        + toRdf.tab1('rdfs:comment', getDescFromOntology(term), '"');
                }
                ;
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + pC.id + suffixShape)
                    + toRdf.tab1('a', 'sh:PropertyShape')
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
                    ttlStr += toRdf.tab1('a', 'owl:DatatypeProperty');
            }
            ;
            ttlStr += toRdf.tab1('rdfs:label', ti, '"')
                + toRdf.tab1('rdfs:comment', pC.description, '"')
                + toRdf.tab1('dcterms:modified', pC.changedAt, '"');
        });
        return ttlStr;
    }
    ;
    function MakeClassShape(meC) {
        let ttlStr = toRdf.newLine()
            + toRdf.tab0(self + meC.id + suffixShape)
            + toRdf.tab1('a', 'sh:NodeShape')
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
        let hTerm = app.ontology.getTermResource('resourceClass', organizerClass), rTerm = app.ontology.getTermResource('resourceClass', entityClass);
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Resource Classes')
            + toRdf.newLine('#################################################################')
            + toRdf.newLine()
            + toRdf.tab0(organizerClass)
            + toRdf.tab1('a', 'owl:Class')
            + toRdf.tab1('rdfs:comment', getDescFromOntology(hTerm), '"')
            + toRdf.newLine()
            + toRdf.tab0(entityClass)
            + toRdf.tab1('a', 'owl:Class')
            + toRdf.tab1('rdfs:comment', getDescFromOntology(rTerm), '"');
        rCL.forEach(rC => {
            rC = LIB.itemByKey(extendedClasses, LIB.keyOf(rC));
            let term = app.ontology.getTermResource('resourceClass', rC.title), ti = rC.title.replace('.', ':');
            if (term) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(ti)
                    + toRdf.tab1('owl:subClassOf', app.ontology.organizerClasses.includes(ti) ? organizerClass : entityClass)
                    + toRdf.tab1('rdfs:comment', getDescFromOntology(term), '"');
            }
            ;
            if (isArrayWithContent(rC.propertyClasses))
                ttlStr += MakeClassShape(rC);
            else
                console.warn("RDF/Turtle Export: The resourceClass " + rC.id + " has no propertyClasses");
            ttlStr += toRdf.newLine()
                + toRdf.tab0(self + rC.id);
            if (term)
                ttlStr += toRdf.tab1('owl:subClassOf', ti);
            else
                ttlStr += toRdf.tab1('rdfs:subClassOf', entityClass);
            ttlStr += toRdf.tab1('rdfs:label', ti, '"')
                + toRdf.tab1('rdfs:comment', rC.description, '"')
                + toRdf.tab1(icon, rC.icon, '"')
                + toRdf.tab1('dcterms:modified', rC.changedAt, '"');
        });
        return ttlStr;
    }
    ;
    function transformStatementClasses(sCL) {
        if (!isArrayWithContent(sCL))
            return '';
        let sTerm = app.ontology.getTermResource('statementClass', relationshipClass);
        let ttlStr = toRdf.newLine()
            + toRdf.newLine('#################################################################')
            + toRdf.newLine('# Statement Classes')
            + toRdf.newLine('#################################################################')
            + toRdf.newLine()
            + toRdf.tab0(relationshipClass)
            + toRdf.tab1('a', 'owl:Class')
            + toRdf.tab1('rdfs:label', app.ontology.valueByTitle(sTerm, CONFIG.propClassLocalTerm), '"')
            + toRdf.tab1('rdfs:comment', getDescFromOntology(sTerm), '"')
            + toRdf.newLine()
            + toRdf.tab0(hasSubject)
            + toRdf.tab1('a', 'owl:ObjectProperty')
            + toRdf.newLine()
            + toRdf.tab0(hasObject)
            + toRdf.tab1('a', 'owl:ObjectProperty')
            + toRdf.newLine()
            + toRdf.tab0(hasPart)
            + toRdf.tab1('a', 'owl:ObjectProperty')
            + toRdf.tab1('rdfs:comment', "General containment relationship", '"')
            + toRdf.newLine()
            + toRdf.tab0(hasItem)
            + toRdf.tab1('owl:subPropertyOf', hasPart)
            + toRdf.tab1('rdfs:comment', "Containment relationship reserved for use in a hierarchy.", '"');
        sCL.forEach(sC => {
            sC = LIB.itemByKey(extendedClasses, LIB.keyOf(sC));
            let term = app.ontology.getTermResource('statementClass', sC.title), ti = sC.title.replace('.', ':');
            if (term) {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(ti)
                    + toRdf.tab1('a', 'owl:Class')
                    + toRdf.tab1('rdfs:comment', getDescFromOntology(term), '"');
            }
            ;
            ttlStr += MakeClassShape(sC)
                + toRdf.tab1('sh:property', self + sC.id + suffixHasSbj + suffixShape)
                + toRdf.tab1('sh:property', self + sC.id + suffixHasObj + suffixShape)
                + toRdf.newLine()
                + toRdf.tab0(self + sC.id);
            if (term)
                ttlStr += toRdf.tab1('owl:subClassOf', ti);
            else
                ttlStr += toRdf.tab1('rdfs:subClassOf', relationshipClass);
            ttlStr += toRdf.tab1('rdfs:label', ti, '"')
                + toRdf.tab1('rdfs:comment', sC.description, '"')
                + toRdf.tab1(icon, sC.icon, '"')
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                + toRdf.newLine()
                + toRdf.newLine('# Limit the node classes eligible as subject. Correct this way?')
                + toRdf.tab0(self + sC.id + suffixHasSbj + suffixShape)
                + toRdf.tab1('a', 'sh:PropertyShape')
                + toRdf.tab1('sh:path', self + sC.id + suffixHasSbj)
                + makeObjectList('sh:class', sC.subjectClasses)
                + toRdf.tab1('sh:minCount', '1', '"')
                + toRdf.tab1('sh:maxCount', '1', '"')
                + toRdf.newLine()
                + toRdf.tab0(self + sC.id + suffixHasSbj)
                + toRdf.tab1('a', 'owl:ObjectProperty')
                + toRdf.tab1('rdfs:subPropertyOf', hasSubject)
                + toRdf.tab1('rdfs:label', "Connects the subject of " + self + sC.id, '"')
                + toRdf.tab1('rdfs:domain', self + sC.id)
                + toRdf.tab1('dcterms:modified', sC.changedAt, '"')
                + toRdf.newLine()
                + toRdf.newLine('# Limit the node classes eligible as object. Correct this way?')
                + toRdf.tab0(self + sC.id + suffixHasObj + suffixShape)
                + toRdf.tab1('a', 'sh:PropertyShape')
                + toRdf.tab1('sh:path', self + sC.id + suffixHasObj)
                + makeObjectList('sh:class', sC.objectClasses)
                + toRdf.tab1('sh:minCount', '1', '"')
                + toRdf.tab1('sh:maxCount', '1', '"')
                + toRdf.newLine()
                + toRdf.tab0(self + sC.id + suffixHasObj)
                + toRdf.tab1('a', 'owl:ObjectProperty')
                + toRdf.tab1('rdfs:subPropertyOf', hasObject)
                + toRdf.tab1('rdfs:label', "Connects the object of " + self + sC.id, '"')
                + toRdf.tab1('rdfs:domain', self + sC.id)
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
                + toRdf.newLine('# Statements')
                + toRdf.newLine('#################################################################');
            sL.forEach(s => {
                ttlStr += toRdf.newLine()
                    + toRdf.tab0(self + s.id)
                    + toRdf.tab1('a', self + s['class'].id)
                    + toRdf.tab1(self + s['class'].id + suffixHasSbj, self + s.subject.id)
                    + toRdf.tab1(self + s['class'].id + suffixHasObj, self + s.object.id)
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
                + toRdf.tab1('a', organizer)
                + toRdf.tab1('rdfs:label', 'Hierarchy Root', '"')
                + toRdf.tab1('rdfs:comment', '... anchoring all hierarchies of this graph (project)', '"');
            nodes.forEach((nd) => {
                ttlStr += toRdf.tab1(hasChild, nd.id);
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
                    + toRdf.tab1(hasItem, self + tree.resource.id);
                if (Array.isArray(tree.nodes))
                    tree.nodes.forEach((nd, i) => {
                        if (i == 0)
                            ttlStr += toRdf.tab1(hasChild, nd.id);
                        else
                            ttlStr += toRdf.tab2(nd.id);
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
    function makeObjectList(pred, L) {
        let str = "";
        if (Array.isArray(L) && L.length > 0) {
            str += toRdf.tab1(pred, self + L[0].id);
            for (let i = 1; i < L.length; i++) {
                str += ", " + self + L[i].id;
            }
            ;
        }
        ;
        return str;
    }
    function getDescFromOntology(term) {
        return app.ontology.valueByTitle(term, CONFIG.propClassDesc);
    }
};
