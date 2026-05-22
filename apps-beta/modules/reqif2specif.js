"use strict";
/*!
    ReqIF to SpecIF v1.1 Transformation
    (C)copyright adesso SE, enso managers gmbh (http://enso-managers.de)
    Author: jasmin.droescher@adesso.de, se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution as Github issue (https://github.com/enso-managers/SpecIF-Tools/issues)

    ToDo:
    - transform RELATION-GROUP-TYPES and RELATION-GROUPS
    - extract default values
*/
function reqif2Specif(xml, options) {
    const RE_NS_LINK = /\sxmlns:(.*?)=\".*?\"/, opts = Object.assign({
        propType: CONFIG.propClassType,
        prefixN: "N-"
    }, options);
    const parsed = parseXML(xml);
    if (!parsed.ok)
        return parsed;
    const reqifDoc = parsed.response;
    var xhr;
    if (validateReqif(reqifDoc))
        xhr = { ok: true, status: 0, statusText: "ReqIF data is valid", responseType: 'json' };
    else
        return { ok: false, status: 899, statusText: "ReqIF data is invalid" };
    xhr.response = extractMetaData(reqifDoc.getElementsByTagName("REQ-IF-HEADER"));
    xhr.response.dataTypes = extractDatatypes(reqifDoc.getElementsByTagName("DATATYPES"));
    xhr.response.propertyClasses = extractPropertyClasses(reqifDoc.getElementsByTagName("SPEC-TYPES"));
    xhr.response.resourceClasses = extractElementClasses(reqifDoc.getElementsByTagName("SPEC-TYPES"), ['SPECIFICATION-TYPE', 'SPEC-OBJECT-TYPE']);
    xhr.response.statementClasses = extractElementClasses(reqifDoc.getElementsByTagName("SPEC-TYPES"), ['SPEC-RELATION-TYPE']);
    xhr.response.resources = extractResources("SPEC-OBJECTS")
        .concat(extractResources("SPECIFICATIONS"));
    xhr.response.statements = extractStatements(reqifDoc.getElementsByTagName("SPEC-RELATIONS"));
    xhr.response.hierarchies = extractHierarchies(reqifDoc.getElementsByTagName("SPECIFICATIONS"));
    if (!xhr.response.title) {
        let ti = '', r;
        xhr.response.nodes.forEach((h) => {
            r = itemById(xhr.response.resources, h.resource);
            ti += (ti.length > 0 ? ', ' : '') + r.title;
        });
        xhr.response.title = ti;
        console.info('Project title assembled from ReqIF SPECIFICATION roots');
    }
    ;
    console.info('reqif2specif', xhr);
    return xhr;
    function validateReqif(xml) {
        return xml.getElementsByTagName("REQ-IF-HEADER").length > 0
            && xml.getElementsByTagName("REQ-IF-CONTENT").length > 0;
    }
    function extractMetaData(header) {
        let id = header[0].getAttribute("IDENTIFIER");
        return ({
            id: id,
            title: (header[0].getElementsByTagName("TITLE")[0] && header[0].getElementsByTagName("TITLE")[0].innerHTML) || id,
            description: header[0].getElementsByTagName("COMMENT")[0] && header[0].getElementsByTagName("COMMENT")[0].innerHTML || '',
            generator: 'reqif2specif',
            $schema: "https://specif.de/v1.0/schema.json",
            createdAt: header[0].getElementsByTagName("CREATION-TIME")[0].innerHTML
        });
    }
    ;
    function extractDatatypes(xmlDatatypes) {
        let specifDataTypes = xmlDatatypes.length < 1 ? [] : Array.from(xmlDatatypes[0].children, extractDatatype);
        return specifDataTypes;
        function extractDatatype(datatype) {
            let specifDatatype = {
                id: datatype.getAttribute("IDENTIFIER"),
                type: getTypeOfDatatype(datatype),
                title: datatype.getAttribute("LONG-NAME") || '',
                description: datatype.getAttribute("DESC") || '',
                changedAt: datatype.getAttribute("LAST-CHANGE") || ''
            };
            extr("MIN", "minInclusive");
            extr("MAX", "maxInclusive");
            extr("MAX-LENGTH", "maxLength");
            extr("ACCURACY", "fractionDigits");
            if (datatype.childElementCount > 0)
                specifDatatype.values = extractDataTypeValues(datatype.children);
            return specifDatatype;
            function extr(rqA, spP) {
                let val = datatype.getAttribute(rqA);
                if (val)
                    specifDatatype[spP] = Number(val);
            }
            function getTypeOfDatatype(datatype) {
                return {
                    "DATATYPE-DEFINITION-BOOLEAN": 'xs:boolean',
                    "DATATYPE-DEFINITION-DATE": 'xs:dateTime',
                    "DATATYPE-DEFINITION-INTEGER": 'xs:integer',
                    "DATATYPE-DEFINITION-REAL": 'xs:double',
                    "DATATYPE-DEFINITION-STRING": 'xs:string',
                    "DATATYPE-DEFINITION-XHTML": 'xhtml',
                    "DATATYPE-DEFINITION-ENUMERATION": 'xs:enumeration',
                }[datatype.nodeName];
            }
            function extractDataTypeValues(DataTypeValuesHtmlCollection) {
                return Array.from(DataTypeValuesHtmlCollection[0].children, extractEnumValue);
                function extractEnumValue(ch) {
                    return {
                        id: ch.getAttribute("IDENTIFIER"),
                        value: ch.getAttribute("LONG-NAME") || '&#x00ab;undefined&#x00bb;'
                    };
                }
            }
        }
    }
    ;
    function pcTypeIdL(pCL) {
        return pCL.filter(pC => pC.title == opts.propType)
            .map(pC => pC.id);
    }
    function extractPropertyClasses(xmlSpecTypes) {
        const specAttributesMap = extractSpecAttributesMap(xmlSpecTypes[0]);
        let specifPropertyClasses = extractPropertyClassesFromSpecAttributeMap(specAttributesMap);
        if (pcTypeIdL(specifPropertyClasses).length < 1) {
            xhr.response.dataTypes.push({
                id: "DT-ShortString-" + xhr.response.id,
                type: "xs:string",
                title: "String[256]",
                description: "String with length <=256",
                maxLength: 256,
                changedAt: new Date().toISOString()
            });
            specifPropertyClasses.push({
                id: "PC-Type-" + xhr.response.id,
                dataType: "DT-ShortString-" + xhr.response.id,
                title: opts.propType,
                description: "The nature or genre of the resource.",
                changedAt: new Date().toISOString()
            });
        }
        ;
        return specifPropertyClasses;
        function extractPropertyClassesFromSpecAttributeMap(specAttributeMap) {
            let propertyClasses = Object.entries(specAttributeMap).map(entry => {
                let propertyClass = {
                    id: entry[0],
                    title: entry[1].title,
                    dataType: entry[1].dataType,
                    changedAt: entry[1].changedAt
                };
                if (entry[1].multiple)
                    propertyClass.multiple = true;
                return propertyClass;
            });
            return propertyClasses;
        }
        function extractSpecAttributesMap(specTypesDocument) {
            return Object.assign({}, extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-STRING"), extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-XHTML"), extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-ENUMERATION"), extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-DATE"), extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-BOOLEAN"), extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-INTEGER"), extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-REAL"));
            function extractSpecAttributeTypeMap(specTypesDocument, nodeName) {
                let attributeDefinitions = specTypesDocument.getElementsByTagName(nodeName), attributeDefinitionMap = {};
                Array.from(attributeDefinitions, definition => {
                    attributeDefinitionMap[definition.getAttribute("IDENTIFIER")] =
                        {
                            title: definition.getAttribute("LONG-NAME"),
                            dataType: definition.children[0].children[0].innerHTML,
                            changedAt: definition.getAttribute("LAST-CHANGE"),
                        };
                    if (nodeName == "ATTRIBUTE-DEFINITION-ENUMERATION") {
                        let multiple = definition.getAttribute("MULTI-VALUED");
                        if (multiple && multiple.toLowerCase() == 'true')
                            attributeDefinitionMap[definition.getAttribute("IDENTIFIER")].multiple = true;
                    }
                });
                return attributeDefinitionMap;
            }
        }
    }
    function extractElementClasses(xmlSpecTypes, subset) {
        if (xmlSpecTypes.length < 1)
            return [];
        const specifElementClasses = [];
        Array.from(xmlSpecTypes[0].children, xmlSpecType => {
            if (subset.includes(xmlSpecType.nodeName)) {
                let elC = extractElementClass(xmlSpecType);
                if (xmlSpecType.nodeName == 'SPECIFICATION-TYPE') {
                    let idL = pcTypeIdL(xhr.response.propertyClasses);
                    if (idL.length > 0) {
                        Array.isArray(elC.propertyClasses) ?
                            addPcTypeIfMissing(elC.propertyClasses, idL)
                            : elC.propertyClasses = [idL[0]];
                    }
                    else
                        console.error("There is no propertyClass ");
                }
                ;
                specifElementClasses.push(elC);
            }
        });
        return specifElementClasses;
        function addPcTypeIfMissing(pCL, idL) {
            for (let pC of pCL) {
                if (idL.includes(pC.id))
                    return;
            }
            ;
            pCL.push(idL[0]);
        }
        function extractElementClass(xmlSpecType) {
            const specifElementClass = {
                id: xmlSpecType.getAttribute("IDENTIFIER"),
                title: xmlSpecType.getAttribute("LONG-NAME") || xmlSpecType.getAttribute("IDENTIFIER"),
                changedAt: xmlSpecType.getAttribute("LAST-CHANGE")
            };
            if (xmlSpecType.getAttribute("DESC"))
                specifElementClass.description = xmlSpecType.getAttribute("DESC");
            if (xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES")[0])
                specifElementClass.propertyClasses = extractPropertyClassReferences(xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES"));
            return specifElementClass;
            function extractPropertyClassReferences(propertyClassesDocument) {
                return Array.from(propertyClassesDocument[0].children, property => { return property.getAttribute("IDENTIFIER"); });
            }
        }
    }
    function extractResources(tagName) {
        let xmlSpecObjects = reqifDoc.getElementsByTagName(tagName);
        return xmlSpecObjects.length < 1 ? [] : Array.from(xmlSpecObjects[0].children, extractResource);
        function extractResource(xmlSpecObject) {
            let specifResource = {
                id: xmlSpecObject.getAttribute("IDENTIFIER"),
                title: xmlSpecObject.getAttribute("LONG-NAME") || "",
                changedAt: xmlSpecObject.getAttribute("LAST-CHANGE")
            };
            specifResource['class'] = xmlSpecObject.getElementsByTagName("TYPE")[0].children[0].innerHTML;
            let values = xmlSpecObject.getElementsByTagName("VALUES");
            specifResource.properties = extractProperties(values);
            if (!specifResource.title && specifResource.properties.length < 1)
                specifResource.title = specifResource.id;
            if (tagName == 'SPECIFICATIONS') {
                let idL = pcTypeIdL(xhr.response.propertyClasses), prp = {
                    class: idL[0],
                    value: "ReqIF:HierarchyRoot"
                };
                let p = pType(idL);
                if (p)
                    p.value = prp.value;
                else
                    specifResource.properties.push(prp);
            }
            ;
            return specifResource;
            function pType(L) {
                for (var p of specifResource.properties) {
                    if (L.includes(p['class']))
                        return p;
                }
                ;
            }
        }
    }
    function extractStatements(xmlSpecRelations) {
        return xmlSpecRelations.length < 1 ? [] : Array.from(xmlSpecRelations[0].children, extractStatement);
        function extractStatement(xmlSpecRelation) {
            let specifStatement = {
                id: xmlSpecRelation.getAttribute("IDENTIFIER"),
                subject: xmlSpecRelation.getElementsByTagName("SOURCE")[0].children[0].innerHTML,
                object: xmlSpecRelation.getElementsByTagName("TARGET")[0].children[0].innerHTML,
                changedAt: xmlSpecRelation.getAttribute("LAST-CHANGE")
            };
            specifStatement['class'] = xmlSpecRelation.getElementsByTagName("TYPE")[0].children[0].innerHTML;
            let values = xmlSpecRelation.getElementsByTagName("VALUES");
            specifStatement.properties = extractProperties(values);
            return specifStatement;
        }
    }
    function extractProperties(specAttributes) {
        if (specAttributes.length < 1)
            return [];
        let list = [];
        Array.from(specAttributes[0].children, (prp) => { let p = extractSpecIfProperty(prp); if (p.value)
            list.push(p); });
        return list;
        function extractSpecIfProperty(property) {
            let specifProperty = {}, pC, dT;
            specifProperty['class'] = property.getElementsByTagName("DEFINITION")[0].children[0].innerHTML;
            if (property.getAttribute("THE-VALUE")) {
                specifProperty.value = property.getAttribute("THE-VALUE");
                pC = itemById(xhr.response.propertyClasses, specifProperty['class']);
                dT = itemById(xhr.response.dataTypes, pC.dataType);
                if (typeof (dT.maxLength) == 'number' && dT.maxLength < specifProperty.value.length) {
                    console.warn("Truncated ReqIF Attribute with value '" + specifProperty.value + "' to the specified maxLength of " + dT.maxLength + " characters");
                    specifProperty.value = specifProperty.value.substring(0, dT.maxLength);
                }
                ;
            }
            else if (property.getElementsByTagName("THE-VALUE")[0])
                specifProperty.value = removeNamespace(property.getElementsByTagName("THE-VALUE")[0].innerHTML);
            else if (property.getElementsByTagName("VALUES")[0]) {
                specifProperty.value = '';
                Array.from(property.getElementsByTagName("VALUES")[0].children, (ch) => { specifProperty.value += (specifProperty.value.length > 0 ? ',' : '') + ch.innerHTML; });
            }
            ;
            return specifProperty;
        }
    }
    function extractHierarchies(xmlSpecifications) {
        return xmlSpecifications.length < 1 ? [] : Array.from(xmlSpecifications[0].getElementsByTagName("SPECIFICATION"), extractHierarchy);
        function extractHierarchy(xmlSpecification) {
            let hId = xmlSpecification.getAttribute("IDENTIFIER");
            return {
                id: opts.prefixHR + hId,
                resource: hId,
                changedAt: xmlSpecification.getAttribute("LAST-CHANGE"),
                nodes: extractNodes(xmlSpecification.children)
            };
            function extractNodes(L) {
                let ch1 = getNodeswithTag(L, 'CHILDREN')[0];
                if (ch1) {
                    let L = [];
                    Array.from(ch1.children, (ch) => {
                        let obj = getNodeswithTag(ch.children, 'OBJECT')[0], ref = obj.getElementsByTagName('SPEC-OBJECT-REF')[0], oId = ref.innerHTML;
                        L.push({
                            id: ch.getAttribute("IDENTIFIER"),
                            resource: oId,
                            changedAt: ch.getAttribute("LAST-CHANGE"),
                            nodes: extractNodes(ch.children)
                        });
                    });
                    return L;
                }
                ;
            }
            ;
            function getNodeswithTag(chL, tag) {
                let a = Array.from(chL);
                return a.filter(el => { return el.nodeName == tag; });
            }
        }
    }
    function parseXML(input) {
        if (typeof (input) !== 'string') {
            return { ok: true, status: 297, statusText: '', response: input, responseType: 'document' };
        }
        const parser = new DOMParser(), doc = parser.parseFromString(input, 'application/xml');
        if (doc.getElementsByTagName('parsererror').length > 0) {
            return { ok: false, status: 898, statusText: 'XML parse error: invalid XML document' };
        }
        return { ok: true, status: 298, statusText: '', response: doc, responseType: 'document' };
    }
    function itemById(L, id) {
        if (L && id) {
            id = id.trim();
            for (var i = L.length - 1; i > -1; i--)
                if (L[i].id == id)
                    return L[i];
        }
        ;
    }
    function removeNamespace(input) {
        let namespace = getNameSpace(RE_NS_LINK, input);
        let string = input.replace(RE_NS_LINK, '');
        const RE_namespace = new RegExp(namespace, 'g');
        string = string.replace(RE_namespace, '');
        return string;
        function getNameSpace(regEX, string) {
            let namespace = '';
            string = string.replace(regEX, function ($0, $1) {
                namespace = $1 + ":";
                return '';
            });
            return namespace;
        }
    }
}
