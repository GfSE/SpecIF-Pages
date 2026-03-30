"use strict";
/*!	Product Information Graph (PIG) import and export in native JSON-LD format
*	Dependencies: specif2turtle.mod.ts
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
    name: 'ioPigJsonld'
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
        const sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName) + '#'), ontURI = pigOnto + '#', date = new Date().toISOString();
        var pig = {
            "@context": makeContext(),
            "@id": LIB.makeIdWithNamespace(nsData, specifData.id),
            "@type": "pig:Package",
            [DcProperty.title]: xMultilanguageText(specifData.title),
            [DcProperty.description]: xMultilanguageText(specifData.description),
            [DcProperty.creator]: specifData.createdBy ? specifData.createdBy.email : undefined,
            [DcProperty.modified]: specifData.createdAt,
            "@graph": declarePigClasses()
        };
        [
            { fn: xPropertyClass, iL: specifData.propertyClasses },
            { fn: xResourceClass, iL: specifData.resourceClasses },
            { fn: xStatementClass, iL: specifData.statementClasses },
            { fn: xResource, iL: specifData.resources },
            { fn: xStatement, iL: specifData.statements }
        ].forEach((dtr) => {
            for (let itm of dtr.iL)
                pig['@graph'] = pig['@graph'].concat(dtr.fn(itm));
        });
        pig['@graph'] = pig['@graph'].concat(xAHierarchy(specifData));
        console.debug('pig.jsonld:', pig);
        return JSON.stringify(pig);
        function makeContext() {
            const usedPrefixes = new Set();
            usedPrefixes.add('rdf');
            usedPrefixes.add('sh');
            usedPrefixes.add('owl');
            usedPrefixes.add('pig');
            usedPrefixes.add('pigShapes_pig');
            function addPrefix(id) {
                if (!id)
                    return;
                const match = id.match(/^([\w-]+)(:|\.)/);
                if (match)
                    usedPrefixes.add(match[1]);
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
                    });
                }
            });
            let ctx = {
                "o": ontURI,
                "d": sourceURI
            };
            for (let [tag, val] of app.ontology.namespaces) {
                const cleanTag = tag.replace(/[\.:]$/, '');
                if (usedPrefixes.has(cleanTag)) {
                    ctx[cleanTag] = val.url;
                }
            }
            return ctx;
        }
        function xClass(c) {
            return {
                "@id": LIB.makeIdWithNamespace(nsOnto, c.id),
                [DcProperty.title]: xMultilanguageText(c.title),
                [DcProperty.description]: xMultilanguageText(c.description)
            };
        }
        function xPropertyClass(c) {
            let L = [];
            if (!excludeProperties.includes(c.id) && !isRdfImplicit(c.id)) {
                let dT = LIB.itemByKey(specifData.dataTypes, c.dataType), pC = xClass(c);
                pC['@type'] = dT.enumeration ? "owl:ObjectProperty" : "owl:DatatypeProperty";
                pC[PigProperty.itemType] = { '@id': PigItemType.Property };
                pC[ShaclProperty.datatype] = makeRef(nsOnto, dT.type);
                if (LIB.isArrayWithContent(dT.enumeration)) {
                    pC[PigProperty.eligibleValue] = [];
                    dT.enumeration.forEach(item => {
                        pC[PigProperty.eligibleValue].push({
                            "@id": LIB.makeIdWithNamespace(nsOnto, item.id),
                            [DcProperty.title]: xMultilanguageText(item.value)
                        });
                    });
                }
                else {
                    pC[ShaclProperty.minCount] = c.required ? 1 : undefined;
                    pC[ShaclProperty.maxCount] = c.multiple ? undefined : 1;
                    if (dT.maxLength)
                        pC[ShaclProperty.maxLength] = typeof (dT.maxLength) == 'string' ? parseInt(dT.maxLength, 10) : dT.maxLength;
                    if (dT.minInclusive)
                        pC[ShaclProperty.minInclusive] = typeof (dT.minInclusive) == 'string' ? parseFloat(dT.minInclusive) : dT.minInclusive;
                    if (dT.maxInclusive)
                        pC[ShaclProperty.maxInclusive] = typeof (dT.maxInclusive) == 'string' ? parseFloat(dT.maxInclusive) : dT.maxInclusive;
                    if (dT.fractionDigits)
                        pC[ShaclProperty.pattern] = `^\\d+(\\\\.\\\\d{0,${dT.fractionDigits}})?$`;
                }
                ;
                L.push(pC);
            }
            ;
            return L;
        }
        function xElementClass(c, subOf) {
            let pL = [];
            if (LIB.isArrayWithContent(c.propertyClasses)) {
                const fL = c.propertyClasses.filter(pc => !isPigNative(pc.id));
                for (let pc of fL)
                    pL.push(makeRef(nsOnto, pc.id));
            }
            return Object.assign(xClass(c), {
                [PigProperty.specializes]: makeRef(nsOnto, c.extends ? c.extends.id : subOf),
                [PigProperty.icon]: typeof (c.icon) == 'string' && c.icon.length > 0 ? { ['@value']: c.icon } : undefined,
                [PigProperty.eligibleProperty]: pL
            });
        }
        function xResourceClass(c) {
            if (excludeEntities.includes(c.id) || isRdfImplicit(c.id))
                return [];
            const ity = app.ontology.organizerClasses.includes(c.title) ? PigItemType.Organizer : PigItemType.Entity, ent = xElementClass(c, ity);
            if (ity == PigItemType.Entity)
                ent[PigProperty.eligibleTargetLink] = [];
            ent[PigProperty.itemType] = { '@id': PigItemType.Entity };
            return [ent];
        }
        function xStatementClass(c) {
            if (excludeRelationships.includes(c.id) || isRdfImplicit(c.id) || diagramRels.includes(c.id))
                return [];
            const r = Object.assign(xElementClass(c, PigItemType.Relationship), {
                [PigProperty.itemType]: { '@id': PigItemType.Relationship },
                [PigProperty.eligibleSourceLink]: LIB.makeIdWithNamespace(nsOnto, c.id + sfx_toSrc),
                [PigProperty.eligibleTargetLink]: LIB.makeIdWithNamespace(nsOnto, c.id + sfx_toTrg)
            }), srcL = LIB.isArrayWithContent(c.subjectClasses) ? c.subjectClasses : [PigItemType.Entity, PigItemType.Relationship], rs = {
                ['@id']: LIB.makeIdWithNamespace(nsOnto, c.id + sfx_toSrc),
                [PigProperty.itemType]: { '@id': PigItemType.Link },
                [PigProperty.specializes]: { '@id': PigProperty.SourceLink },
                [DcProperty.title]: [{ ['@value']: c.id + " to source" }],
                [DcProperty.description]: xMultilanguageText('Connects the source of ' + c.id),
                [PigProperty.eligibleEndpoint]: makeList(nsOnto, srcL)
            }, tgtL = LIB.isArrayWithContent(c.objectClasses) ? c.objectClasses : [PigItemType.Entity, PigItemType.Relationship], rt = {
                ['@id']: LIB.makeIdWithNamespace(nsOnto, c.id + sfx_toTrg),
                [PigProperty.itemType]: { '@id': PigItemType.Link },
                [PigProperty.specializes]: { '@id': PigProperty.TargetLink },
                [DcProperty.title]: [{ ['@value']: c.id + " to target" }],
                [DcProperty.description]: xMultilanguageText('Connects the target of ' + c.id),
                [PigProperty.eligibleEndpoint]: makeList(nsOnto, tgtL)
            };
            return [r, rs, rt];
        }
        function xAnElement(c) {
            let el = {
                "@id": LIB.makeIdWithNamespace(nsData, c.id),
                "@type": LIB.makeIdWithNamespace(nsOnto, c['class'].id),
                [PigProperty.revision]: c.revision,
                [PigProperty.priorRevision]: c.replaces,
                [DcProperty.modified]: c.changedAt ?? date,
                [DcProperty.creator]: c.changedBy
            };
            if (LIB.isArrayWithContent(c.properties)) {
                c.properties.forEach(p => {
                    if (p.values.length > 0) {
                        let pred = LIB.makeIdWithNamespace(nsOnto, p['class'].id);
                        if (p.values[0].id) {
                            let L = [];
                            for (let v of p.values) {
                                L.push({
                                    "@id": LIB.makeIdWithNamespace(nsData, v.id),
                                    [PigProperty.itemType]: { '@id': PigItemType.aProperty }
                                });
                            }
                            ;
                            el[pred] = L;
                        }
                        else {
                            if (LIB.isMultiLanguageValue(p.values[0])) {
                                if (p.values.length > 1) {
                                    console.warn('specif2jsonld: Only the first value of a property is transformed:', p);
                                }
                                ;
                                const ity = isPigNative(pred) ? undefined : PigItemType.aProperty;
                                el[pred] = xMultilanguageText(p.values[0], ity);
                            }
                            else {
                                let L = [];
                                for (let v of p.values) {
                                    L.push({
                                        "@value": v,
                                        [PigProperty.itemType]: { '@id': PigItemType.aProperty }
                                    });
                                }
                                ;
                                el[pred] = L;
                            }
                            ;
                        }
                    }
                });
            }
            ;
            return el;
        }
        function xResource(r) {
            if (hierarchyItems.includes(r['class'].id))
                return [];
            let e = xAnElement(r);
            e[PigProperty.itemType] = { '@id': PigItemType.anEntity };
            switch (e['@type']) {
                case 'pig:View':
                    let sL = specifData.statements.filter(s => {
                        return s['class'].id.includes(':shows') && s.subject.id == r.id;
                    });
                    if (sL.length > 0) {
                        let L = [];
                        for (let s of sL) {
                            L.push({ "@id": LIB.makeIdWithNamespace(nsData, s.object.id), [PigProperty.itemType]: { '@id': PigItemType.aTargetLink } });
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
                            L.push({ "@id": LIB.makeIdWithNamespace(nsData, s.subject.id), [PigProperty.itemType]: { '@id': PigItemType.aTargetLink } });
                        }
                        ;
                        e[PigProperty.depicts] = L;
                    }
                    ;
            }
            ;
            return [e];
        }
        function xStatement(s) {
            let r = xAnElement(s);
            if (['SpecIF:shows', 'uml:ownedDiagram'].includes(r['@type']))
                return [];
            r[PigProperty.itemType] = { '@id': PigItemType.aRelationship };
            r[LIB.makeIdWithNamespace(nsOnto, s['class'].id) + sfx_toSrc] = { "@id": LIB.makeIdWithNamespace(nsData, s.subject.id), [PigProperty.itemType]: { '@id': PigItemType.aSourceLink } };
            r[LIB.makeIdWithNamespace(nsOnto, s['class'].id) + sfx_toTrg] = { "@id": LIB.makeIdWithNamespace(nsData, s.object.id), [PigProperty.itemType]: { '@id': PigItemType.aTargetLink } };
            return [r];
        }
        function xAHierarchy(n) {
            let g = [], hr = {
                "@id": LIB.makeIdWithNamespace(nsData, "HierarchyRoot" + '-' + specifData.id),
                "@type": PigItemType.HierarchyRoot,
                [PigProperty.itemType]: { '@id': PigItemType.anEntity },
                [DcProperty.modified]: date,
                [DcProperty.title]: xMultilanguageText('Hierarchy Root'),
                [DcProperty.description]: xMultilanguageText('... anchoring all hierarchies of this graph (package)')
            };
            g.push(hr);
            if (LIB.isArrayWithContent(n.nodes)) {
                hr[PigProperty.lists] = n.nodes.map(nd => xAHierarchyItem(nd));
            }
            ;
            return g;
            function xAHierarchyItem(n) {
                const r = LIB.itemById(specifData.resources, n.resource.id);
                if (hierarchyItems.includes(r['class'].id)) {
                    let hi = xAnElement(r);
                    hi[PigProperty.itemType] = { '@id': PigItemType.anEntity };
                    if (n.nodes && n.nodes.length > 0) {
                        hi[PigProperty.lists] = n.nodes.map(nd => xAHierarchyItem(nd));
                    }
                    ;
                    g.push(hi);
                }
                ;
                return { "@id": LIB.makeIdWithNamespace(nsData, n.resource.id), [PigProperty.itemType]: { '@id': PigItemType.aTargetLink } };
            }
        }
        function declarePigClasses() {
            function xTerm(str) {
                let terms = new Map([
                    [RdfProperty.label, { jsonld: DcProperty.title }],
                    [RdfProperty.comment, { jsonld: DcProperty.description }]
                ]);
                return terms.get(str)?.jsonld ?? str;
            }
            let L = [];
            pigEntities.forEach(c => {
                let ty = c[1].startsWith("owl:") ? "@type" : PigProperty.specializes, pL = [], rL = [];
                if (LIB.isArrayWithContent(c[4]))
                    for (let p of c[4])
                        pL.push(makeRef(nsOnto, xTerm(p)));
                if (LIB.isArrayWithContent(c[5]))
                    for (let r of c[5])
                        rL.push(makeRef(nsOnto, xTerm(r)));
                L.push({
                    "@id": c[0],
                    [ty]: (ty == "@type") ? c[1] : makeRef(nsOnto, c[1]),
                    [PigProperty.itemType]: { '@id': PigItemType.Entity },
                    [DcProperty.title]: xMultilanguageText(c[2]),
                    [DcProperty.description]: c[3] ? xMultilanguageText(c[3]) : undefined,
                    [PigProperty.eligibleProperty]: pL,
                    [PigProperty.eligibleTargetLink]: rL.length > 0 ? rL : undefined,
                });
            });
            pigRelationships.forEach(c => {
                let ty = c[1].startsWith("owl:") ? "@type" : PigProperty.specializes, pL = [];
                if (LIB.isArrayWithContent(c[4]))
                    for (let p of c[4])
                        pL.push(makeRef(nsOnto, xTerm(p)));
                L.push({
                    "@id": c[0],
                    [ty]: (ty == "@type") ? c[1] : makeRef(nsOnto, c[1]),
                    [PigProperty.itemType]: { '@id': PigItemType.Relationship },
                    [DcProperty.title]: xMultilanguageText(c[2]),
                    [DcProperty.description]: c[3] ? xMultilanguageText(c[3]) : undefined,
                    [PigProperty.eligibleProperty]: pL,
                    [PigProperty.eligibleSourceLink]: makeRef(nsOnto, xTerm(c[5])),
                    [PigProperty.eligibleTargetLink]: makeRef(nsOnto, xTerm(c[6]))
                });
            });
            pigProperties.forEach(c => {
                let ty = c[1].startsWith("owl:") ? "@type" : PigProperty.specializes;
                L.push({
                    "@id": c[0],
                    [ty]: (ty == "@type") ? c[1] : makeRef(nsOnto, c[1]),
                    [PigProperty.itemType]: { '@id': PigItemType.Property },
                    [DcProperty.title]: xMultilanguageText(c[4]),
                    [DcProperty.description]: c[5] ? xMultilanguageText(c[5]) : undefined,
                    [ShaclProperty.datatype]: makeRef(undefined, c[3]),
                    [ShaclProperty.maxLength]: c[6],
                    [ShaclProperty.minCount]: c[7],
                    [ShaclProperty.maxCount]: c[8]
                });
            });
            pigLinks.forEach(c => {
                let ty = c[1].startsWith("owl:") ? "@type" : PigProperty.specializes;
                L.push({
                    "@id": c[0],
                    [ty]: (ty == "@type") ? c[1] : makeRef(nsOnto, c[1]),
                    [PigProperty.itemType]: { '@id': PigItemType.Link },
                    [PigProperty.eligibleEndpoint]: makeSet(nsOnto, c[3]),
                    [DcProperty.title]: xMultilanguageText(c[4]),
                    [DcProperty.description]: c[5] ? xMultilanguageText(c[5]) : undefined
                });
            });
            return L;
        }
        function xMultilanguageText(txt, itype) {
            let L = [];
            if (LIB.isMultiLanguageValue(txt)) {
                for (let t of txt) {
                    L.push(makeText(t));
                }
                ;
            }
            else if (typeof (txt) === 'string') {
                L.push({ "@value": txt, [PigProperty.itemType]: itype ? { '@id': itype } : undefined });
            }
            ;
            return L.length > 0 ? L : undefined;
            function makeText(t) {
                return {
                    "@value": t.text.replace(/\u000a/g, '\n').replace(/\u000d/g, ''),
                    "@language": t.language,
                    [PigProperty.itemType]: itype ? { '@id': itype } : undefined
                };
            }
        }
        function makeRef(ont, id) {
            if (id)
                return { "@id": LIB.makeIdWithNamespace(ont, id) };
        }
        function makeList(ont, L) {
            if (LIB.isArrayWithContent(L)) {
                let lst = [];
                for (let l of L) {
                    lst.push(makeRef(ont, l.id ?? l));
                }
                ;
                return lst;
            }
            ;
        }
        function makeSet(ont, L) {
            let lst = [];
            for (let l of L) {
                lst.push(makeRef(ont, l.id ?? l));
            }
            ;
            return lst;
        }
    };
    self.abort = () => {
        self.abortFlag = true;
    };
    return self;
});
