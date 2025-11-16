"use strict";
/*!	Product Information Graph (PIG) import and export in JSON-LD format
*	Dependencies: -
*	(C)copyright enso managers gmbh (http://enso-managers.de)
*	Author: se@enso-managers.de, Berlin
*	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
*	We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)
*
*   Assumptions:
*   - specifData is expected in v1.2 format.
*
*	See:
*	- https://www.w3.org/TR/json-ld/ (= https://www.w3.org/TR/json-ld11/)
*	- https://json-ld.org/
*   - https://json-ld.org/spec/latest/
*	- https://paulfrazee.medium.com/pauls-notes-on-how-json-ld-works-965732ea559d
*	- https://linkeddatatools.com/introduction-json-ld/
*	- https://json-ld.org/playground/
*	- Ordering for streaming JSON-LD: https://w3c.github.io/json-ld-streaming/#streaming-document-form
*/
moduleManager.construct({
    name: 'ioJsonld'
}, (self) => {
    "use strict";
    let mime, opts;
    self.init = (options) => {
        mime = undefined;
        opts = options;
        return true;
    };
    self.abortFlag = false;
    self.fromSpecif = (specifData, opts) => {
        opts = {
            includeContext: true,
            includeClasses: true,
            ...opts
        };
        const sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '#'), ontURI = pigOnto + '#', extendedClasses = LIB.getExtendedClasses(specifData.resourceClasses, 'all')
            .concat(LIB.getExtendedClasses(specifData.statementClasses, 'all')), date = new Date().toISOString();
        var pig = {
            "@context": makeContext(),
            "@id": LIB.makeIdWithNamespace(nsData, specifData.id),
            "@type": "pig:Package",
            [RdfProperty.label]: xMultilanguageText(specifData.title),
            [RdfProperty.comment]: xMultilanguageText(specifData.description),
            "dcterms:creator": specifData.createdBy ? specifData.createdBy.email : undefined,
            "dcterms:modified": specifData.createdAt,
            "@graph": declareOntology().concat(declarePigClasses()),
        };
        [
            { fn: xDatatype, iL: specifData.dataTypes },
            { fn: xProperty, iL: specifData.propertyClasses },
            { fn: xEntity, iL: specifData.resourceClasses },
            { fn: xRelationship, iL: specifData.statementClasses },
            { fn: xAnEntity, iL: specifData.resources },
            { fn: xARelationship, iL: specifData.statements }
        ].forEach((dtr) => {
            for (let itm of dtr.iL)
                pig['@graph'] = pig['@graph'].concat(dtr.fn(itm));
        });
        pig['@graph'] = pig['@graph'].concat(xAHierarchy(specifData));
        console.debug('specif2jsonld:', pig);
        return JSON.stringify(pig);
        function makeContext() {
            let ctx = {
                "o": ontURI,
                "d": sourceURI
            };
            for (var [tag, val] of app.ontology.namespaces) {
                ctx[tag.replace(/[\.:]$/, '')] = val.url;
            }
            ;
            if (LIB.isArrayWithContent(nsShapes))
                for (var ns of nsShapes) {
                    ctx[pfx_shape + ns.replace(/[\.:]$/, '')] = pigOnto + '/shapes/' + ns + '#';
                }
            ;
            return ctx;
        }
        function xClass(c, rg) {
            return {
                "@id": LIB.makeIdWithNamespace(nsOnto, c.id),
                [RdfProperty.label]: xMultilanguageText(c.title),
                [RdfProperty.comment]: xMultilanguageText(c.description),
                [RdfProperty.range]: rg
            };
        }
        function xProperty(c) {
            let dT = LIB.itemByKey(specifData.dataTypes, c.dataType), L = [];
            if (!excludeProperties.includes(c.id) && !isRdfImplicit(c.id)) {
                let pC = xClass(c, dT.enumeration ? LIB.makeIdWithNamespace(nsOnto, dT.id) : undefined);
                pC['@type'] = dT.enumeration ? "owl:ObjectProperty" : "owl:DatatypeProperty";
                L.push(pC);
            }
            ;
            let sh = {
                "@id": makeShapeId(LIB.makeIdWithNamespace(nsOnto, c.id)),
                ['@type']: ShaclProperty.propertyShape,
                [ShaclProperty.path]: { "@id": LIB.makeIdWithNamespace(nsOnto, c.id) },
                [ShaclProperty.minCount]: c.required ? "1" : undefined,
                [ShaclProperty.maxCount]: c.multiple ? undefined : "1"
            };
            if (dT.enumeration)
                sh[ShaclProperty.class] = makeRef(nsOnto, dT.id);
            else {
                sh[ShaclProperty.datatype] = { "@id": dT.type };
                if (dT.maxLength)
                    sh[ShaclProperty.maxLength] = typeof (dT.maxLength) == 'string' ? dT.maxLength : dT.maxLength.toString();
                if (dT.minInclusive)
                    sh[ShaclProperty.minInclusive] = typeof (dT.minInclusive) == 'string' ? dT.minInclusive : dT.minInclusive.toString();
                if (dT.maxInclusive)
                    sh[ShaclProperty.maxInclusive] = typeof (dT.maxInclusive) == 'string' ? dT.maxInclusive : dT.maxInclusive.toString();
                if (dT.fractionDigits)
                    sh[ShaclProperty.pattern] = `^\\d+(\\\\.\\\\d{0,${dT.fractionDigits}})?$`;
            }
            ;
            L.push(sh);
            return L;
        }
        function xElement(c, subOf) {
            return Object.assign(xClass(c), { [RdfProperty.subClassOf]: makeRef(nsOnto, c.extends ? c.extends.id : subOf) }, { "pig:icon": c.icon });
        }
        function makeElementShape(c) {
            let pL = [];
            if (LIB.isArrayWithContent(c.propertyClasses))
                for (let p of c.propertyClasses)
                    pL.push({ "@id": makeShapeId(LIB.makeIdWithNamespace(nsOnto, p.id)) });
            return {
                "@id": makeShapeId(LIB.makeIdWithNamespace(nsOnto, c.id)),
                "@type": ShaclProperty.nodeShape,
                [ShaclProperty.property]: pL,
                [ShaclProperty.targetClass]: makeRef(nsOnto, c.id)
            };
        }
        function xEntity(c) {
            if (excludeEntities.includes(c.id) || isRdfImplicit(c.id))
                return [];
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(c)), ity = app.ontology.organizerClasses.includes(c.title) ? PigItemType.Organizer : PigItemType.Entity;
            return [xElement(exC, ity), makeElementShape(exC)];
        }
        function xRelationship(c) {
            if (diagramRels.includes(c.id) || isRdfImplicit(c.id))
                return [];
            const exC = LIB.itemByKey(extendedClasses, LIB.keyOf(c)), relId = LIB.makeIdWithNamespace(nsOnto, c.id), r = xElement(exC, PigItemType.Relationship), rs = {
                "@id": relId + suffixHasSrc,
                [RdfProperty.subPropertyOf]: PigProperty.eligibleSource,
                [RdfProperty.comment]: "Connects the source of " + relId,
                [RdfProperty.domain]: relId,
                [RdfProperty.range]: makeOwlUnion(nsOnto, c.subjectClasses)
            }, rt = {
                "@id": relId + suffixHasTrg,
                [RdfProperty.subPropertyOf]: PigProperty.eligibleTarget,
                [RdfProperty.comment]: "Connects the target of " + relId,
                [RdfProperty.domain]: relId,
                [RdfProperty.range]: makeOwlUnion(nsOnto, c.objectClasses)
            };
            let rS = makeElementShape(exC);
            rS["sh:property"].push({
                [ShaclProperty.path]: makeRef(nsOnto, relId + suffixHasSrc),
                [ShaclProperty.or]: makeShaclOr(nsOnto, ShaclProperty.class, c.subjectClasses),
                [ShaclProperty.minCount]: "1",
                [ShaclProperty.maxCount]: "1"
            });
            rS["sh:property"].push({
                [ShaclProperty.path]: makeRef(nsOnto, relId + suffixHasTrg),
                [ShaclProperty.or]: makeShaclOr(nsOnto, ShaclProperty.class, c.objectClasses),
                [ShaclProperty.minCount]: "1",
                [ShaclProperty.maxCount]: "1"
            });
            return [r, rs, rt, rS];
        }
        function xDatatype(dT) {
            if (!LIB.isArrayWithContent(dT.enumeration))
                return [];
            let dTL = [];
            if (LIB.isArrayWithContent(dT.enumeration)) {
                let e = xClass(dT);
                e['@type'] = 'owl:Class';
                e['owl:oneOf'] = [];
                dTL.push(e);
                dT.enumeration.forEach(item => {
                    e['owl:oneOf'].push({ "@id": LIB.makeIdWithNamespace(nsOnto, item.id) });
                    dTL.push({
                        "@id": LIB.makeIdWithNamespace(nsOnto, item.id),
                        "@type": e['@id'],
                        [RdfProperty.label]: xMultilanguageText(item.value)
                    });
                });
            }
            ;
            return dTL;
        }
        function xAnElement(c) {
            let el = {
                "@id": LIB.makeIdWithNamespace(nsData, c.id),
                "@type": LIB.makeIdWithNamespace(nsOnto, c['class'].id),
                "pig:revision": c.revision,
                "pig:priorRevision": c.replaces,
                "dcterms:modified": c.changedAt ?? date,
                "dcterms:creator": c.changedBy
            };
            if (LIB.isArrayWithContent(c.properties)) {
                c.properties.forEach(p => {
                    if (p.values.length > 0) {
                        let pred = LIB.makeIdWithNamespace(nsOnto, p['class'].id);
                        if (p.values[0].id) {
                            let L = [];
                            for (let v of p.values) {
                                L.push({ "@id": LIB.makeIdWithNamespace(nsData, v.id) });
                            }
                            ;
                            el[pred] = L;
                        }
                        else {
                            if (p.values.length > 1) {
                                console.warn('specif2jsonld: Only the first value of a property is transformed:', p);
                            }
                            ;
                            if (LIB.isMultiLanguageValue(p.values[0])) {
                                el[pred] = xMultilanguageText(p.values[0]);
                            }
                            else {
                                el[pred] = { "@value": p.values[0] };
                            }
                            ;
                        }
                    }
                });
            }
            ;
            return el;
        }
        function xAnEntity(r) {
            if (hierarchyItems.includes(r['class'].id))
                return [];
            let e = xAnElement(r);
            switch (e['@type']) {
                case 'pig:View':
                    let sL = specifData.statements.filter(s => {
                        return s['class'].id.includes(':shows') && s.subject.id == r.id;
                    });
                    if (sL.length > 0) {
                        let L = [];
                        for (let s of sL) {
                            L.push({ "@id": LIB.makeIdWithNamespace(nsData, s.object.id) });
                        }
                        ;
                        e[PigProperty.shows] = L;
                    }
                    ;
                    sL = specifData.statements.filter(s => {
                        return s['class'].id.includes(':ownedDiagram') && s.object.id == r.id;
                    });
                    if (sL.length > 0) {
                        let L = [];
                        for (let s of sL) {
                            L.push({ "@id": LIB.makeIdWithNamespace(nsData, s.subject.id) });
                        }
                        ;
                        e[PigProperty.depicts] = L;
                    }
                    ;
            }
            ;
            return [e];
        }
        function xARelationship(s) {
            let r = xAnElement(s);
            if (['SpecIF:shows', 'uml:ownedDiagram'].includes(r['@type']))
                return [];
            r[r['@type'] + suffixHasSrc] = { "@id": LIB.makeIdWithNamespace(nsData, s.subject.id) };
            r[r['@type'] + suffixHasTrg] = { "@id": LIB.makeIdWithNamespace(nsData, s.object.id) };
            return [r];
        }
        function xAHierarchy(n) {
            let g = [], hr = {
                "@id": LIB.makeIdWithNamespace(nsData, "HierarchyRoot"),
                [RdfProperty.type]: PigItemType.HierarchyRoot,
                [RdfProperty.label]: 'Hierarchy Root',
                [RdfProperty.comment]: '... anchoring all hierarchies of this graph (package)'
            };
            g.push(hr);
            if (LIB.isArrayWithContent(n.nodes)) {
                hr[PigProperty.lists] = makeOrderedList(n.nodes);
            }
            ;
            return g;
            function xAHierarchyItem(n) {
                const r = LIB.itemById(specifData.resources, n.resource.id);
                if (hierarchyItems.includes(r['class'].id)) {
                    let hi = xAnElement(r);
                    if (n.nodes && n.nodes.length > 0) {
                        hi[PigProperty.lists] = makeOrderedList(n.nodes);
                    }
                    ;
                    g.push(hi);
                }
                ;
                return { "@id": LIB.makeIdWithNamespace(nsData, n.resource.id) };
            }
            function makeOrderedList(nL) {
                return { "@list": nL.map(nd => xAHierarchyItem(nd)) };
            }
        }
        function declareOntology() {
            return [{
                    "@id": sourceURI,
                    "@type": "owl:Ontology",
                    [RdfProperty.label]: xMultilanguageText(specifData.title),
                    [RdfProperty.comment]: xMultilanguageText(specifData.description),
                    "owl:imports": [
                        { "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#" },
                        { "@id": "http://www.w3.org/2000/01/rdf-schema#" }
                    ],
                    "dcterms:license": specifData.rights ? specifData.rights.url : undefined,
                    "dcterms:modified": specifData.createdAt,
                    "dcterms:creator": specifData.createdBy ? specifData.createdBy.email : undefined,
                }];
        }
        function declarePigClasses() {
            let L = [];
            pigElements.forEach(c => {
                let ty = c[1].startsWith("owl:") ? "@type" : RdfProperty.subClassOf;
                L.push({
                    "@id": c[0],
                    [ty]: (ty == "@type") ? c[1] : makeRef(nsOnto, c[1]),
                    [RdfProperty.label]: c[2],
                    [RdfProperty.comment]: c[3]
                });
                let pL = [];
                if (LIB.isArrayWithContent(c[4]))
                    for (let p of c[4])
                        pL.push(makeRef(undefined, pfx_shape + p));
                L.push({
                    "@id": pfx_shape + c[0],
                    "@type": ShaclProperty.nodeShape,
                    [ShaclProperty.property]: pL,
                    [ShaclProperty.targetClass]: makeRef(nsOnto, c[0])
                });
            });
            pigProperties.forEach(c => {
                let ty = c[1].startsWith("owl:") ? "@type" : RdfProperty.subPropertyOf;
                L.push({
                    "@id": c[0],
                    [ty]: (ty == "@type") ? c[1] : makeRef(nsOnto, c[1]),
                    [RdfProperty.range]: makeOwlUnion(nsOnto, c[3]),
                    [RdfProperty.label]: c[4],
                    [RdfProperty.comment]: c[5]
                });
                let sh = {
                    "@id": pfx_shape + c[0],
                    ['@type']: ShaclProperty.propertyShape,
                    [ShaclProperty.path]: makeRef(nsOnto, c[0])
                };
                if (Array.isArray(c[3]) && c[3].length > 0 && c[3][0].startsWith(pfx_datatype))
                    sh[ShaclProperty.datatype] = makeRef(undefined, c[3][0]);
                else
                    sh[ShaclProperty.or] = makeShaclOr(nsOnto, ShaclProperty.class, c[3]);
                L.push(sh);
            });
            return L;
        }
        function xMultilanguageText(mlt) {
            if (!Array.isArray(mlt))
                return;
            let L = [];
            for (let t of mlt) {
                if (mlt.length < 2 && RE.Namespace.test(t.text))
                    L.push({ "@id": t.text });
                else
                    L.push({
                        "@value": t.text.replace(/\u000a/g, '\n').replace(/\u000d/g, ''),
                        "@language": t.language
                    });
            }
            ;
            return L;
        }
        function makeRef(ont, id) {
            if (id)
                return { "@id": LIB.makeIdWithNamespace(ont, id) };
        }
        function makeShaclOr(ont, predicate, L) {
            if (LIB.isArrayWithContent(L)) {
                let lst = [];
                for (let l of L) {
                    lst.push({ [predicate]: makeRef(ont, l.id ?? l) });
                }
                ;
                return lst;
            }
            else
                console.error("specif2jsonld: Expecting an array of property shapes for 'sh:or'");
        }
        function makeOwlUnion(ont, L) {
            if (LIB.isArrayWithContent(L)) {
                let un = {};
                if (L.length > 1) {
                    if (L.length > 10)
                        console.warn("specif2jsonld: Many elements in a union: " + L.length + ", beware of performance issues with RDF processors.");
                    let lst = [];
                    for (let l of L) {
                        lst.push(makeRef(ont, l.id ?? l));
                    }
                    ;
                    un['owl:unionOf'] = { "@list": lst };
                }
                else
                    un = makeRef(ont, L[0].id ?? L[0]);
                return un;
            }
            ;
        }
    };
    self.abort = () => {
        self.abortFlag = true;
    };
    return self;
});
