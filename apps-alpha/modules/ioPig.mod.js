"use strict";
/*!	Product Information Graph (PIG) import and export
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
*	- https://paulfrazee.medium.com/pauls-notes-on-how-json-ld-works-965732ea559d
*	- https://linkeddatatools.com/introduction-json-ld/
*	- https://json-ld.org/playground/
*/
moduleManager.construct({
    name: 'ioPig'
}, (self) => {
    "use strict";
    let mime, opts;
    self.init = (options) => {
        mime = undefined;
        opts = options;
        return true;
    };
    self.abortFlag = false;
    self.fromSpecif = (spD, opts) => {
        if (typeof (opts) != 'object')
            opts = {};
        const self = "#", sourceURI = encodeURI((opts.sourceFileName.startsWith('http') ? opts.sourceFileName : opts.baseURI + opts.sourceFileName)), date = new Date().toISOString();
        var pig = {
            "@context": makeContext(),
            "@type": "pig:Package",
            "@id": self + spD.id,
            "dcterms:title": spD.title,
            "dcterms:description": spD.description && spD.description[0] ? spD.description[0].text : null,
            "dcterms:modified": date,
            "@graph": []
        };
        [
            { fn: makePropertyClass, iL: spD.propertyClasses },
            { fn: makeEntityClass, iL: spD.resourceClasses },
            { fn: makeRelationshipClass, iL: spD.statementClasses },
            { fn: makeEntity, iL: spD.resources },
            { fn: makeRelationship, iL: spD.statements }
        ].forEach((dsc) => {
            for (let itm of dsc.iL) {
                pig['@graph'] = pig['@graph'].concat(dsc.fn(itm));
            }
            ;
        });
        cacheL(pig['@graph'], makeHierarchy(spD));
        return JSON.stringify(pig);
        function makeContext() {
            let ctx = {
                "@base": sourceURI
            };
            for (var [key, val] of app.ontology.namespaces) {
                ctx[key.replace('.', ':')] = val.url;
            }
            ;
            return ctx;
        }
        function makeItem(c, ctg) {
            return {
                "@id": self + c.id,
                "@type": ctg,
                "dcterms:modified": c.changedAt,
                "dcterms:creator": c.changedBy,
            };
        }
        function makeClass(c, ctg) {
            return Object.assign(makeItem(c, ctg), {
                "dcterms:title": c.title,
                "dcterms:description": c.description && c.description[0] ? c.description[0].text : null
            });
        }
        function makePropertyClass(c) {
            let dT = LIB.itemByKey(spD.dataTypes, c.dataType), pC = makeClass(c, "pig:propertyClass");
            pC['sh:datatype'] = dT.type;
            pC['sh:minCount'] = c.required ? '1' : '0';
            pC['sh:maxCount'] = c.multiple ? 'unbounded' : '1';
            if (dT.maxLength)
                pC['xs:maxLength'] = dT.maxLength;
            if (dT.minInclusive)
                pC['xs:minInclusive'] = dT.minInclusive;
            if (dT.maxInclusive)
                pC['xs:maxInclusive'] = dT.maxInclusive;
            if (dT.fractionDigits)
                pC['xs:fractionDigits'] = dT.fractionDigits;
            return [pC];
        }
        function makeElementClass(c, ctg) {
            return Object.assign(makeClass(c, ctg), (c.propertyClasses ?
                { "pig:eligiblePropertyClass": c.propertyClasses.map(pc => self + pc.id) } : null), (c.extends ?
                { "pig:specializes": self + c.extends.id } : null));
        }
        function makeEntityClass(c) {
            let enL = [];
            enL.push(Object.assign(makeElementClass(c, "pig:entityClass"), (app.ontology.organizerClasses.includes(c.title) ? {
                "@type": "pig:organizerClass"
            } : null)));
            return enL;
        }
        function makeRelationshipClass(c) {
            let rsL = [];
            rsL.push(Object.assign(makeElementClass(c, "pig:relationshipClass"), {
                "pig:eligibleSubjectClass": (c.subjectClasses ? c.subjectClasses.map(sc => self + sc.id) : 'all'),
                "pig:eligibleObjectClass": (c.objectClasses ? c.objectClasses.map(oc => self + oc.id) : 'all')
            }));
            return rsL;
        }
        function makeElement(e, ctg) {
            let el = makeItem(e, ctg);
            el['pig:hasClass'] = self + e.class.id;
            if (e.properties && e.properties.length > 0) {
                el['pig:hasProperty'] = e.properties.map(p => {
                    return {
                        "@type": "pig:Property",
                        "pig:hasClass": self + p['class'].id,
                        "@value": p.values.map(v => (Array.isArray(v) ? v[0].text : (v.id ? self + v.id : v)))
                    };
                });
            }
            ;
            return el;
        }
        function makeEntity(r) {
            let e = makeElement(r, "pig:Entity");
            return [e];
        }
        function makeRelationship(s) {
            let rs = makeElement(s, "pig:Relationship");
            rs['pig:hasSubject'] = self + s.subject.id;
            rs['pig:hasObject'] = self + s.object.id;
            return [rs];
        }
        function makeHierarchy(n) {
            let h = {
                "@id": self + "N-HierarchyRoot",
                "@type": "pig:Organizer"
            };
            if (n.nodes && n.nodes.length > 0) {
                h['pig:hasChild'] = n.nodes.map(c => makeHierarchyItem(c));
            }
            ;
            return [h];
            function makeHierarchyItem(n) {
                let h = makeItem(n, "pig:Organizer");
                h['pig:hasElement'] = self + n.resource.id;
                if (n.nodes && n.nodes.length > 0) {
                    h['pig:hasChild'] = n.nodes.map(c => makeHierarchyItem(c));
                }
                ;
                return h;
            }
        }
        function cacheL(tgtL, srcL) {
            for (let s of srcL) {
                if (!tgtL.some(t => t['@id'] == s['@id']))
                    tgtL.push(s);
            }
            ;
        }
    };
    self.abort = () => {
        self.abortFlag = true;
    };
    return self;
});
