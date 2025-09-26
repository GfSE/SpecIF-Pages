"use strict";
const CONFIG = {};
CONFIG.specifVersion = "1.2";
CONFIG.appVersion = CONFIG.specifVersion + ".b.2";
CONFIG.imgURL = './assets/images';
CONFIG.remotePath = 'https://specif.de/v' + CONFIG.specifVersion + '/';
CONFIG.localPath = '../../../SpecIF/Pages/v' + CONFIG.specifVersion + '/';
CONFIG.ontologyURL = CONFIG.remotePath + 'Ontology.specif';
CONFIG.localOntologyURL = CONFIG.localPath + 'Ontology.specif';
CONFIG.QuickStartGuideDe =
    CONFIG.QuickStartGuideEn = "https://gfse.github.io/SpecIF-Pages/Manuals/01_Quick-Start-Guide_EN.html";
CONFIG.userNameAnonymous = 'Anonymous';
CONFIG.passwordAnonymous = '';
CONFIG.messageDisplayTimeShort = 4000;
CONFIG.messageDisplayTimeNormal = 8000;
CONFIG.messageDisplayTimeLong = 12000;
CONFIG.noMultipleRefreshWithin = 320;
CONFIG.imageRenderingTimelag = 320;
CONFIG.minInteger = -2147483648;
CONFIG.maxInteger = 2147483647;
CONFIG.minReal = -1.7976931348623157E+308;
CONFIG.maxReal = 1.7976931348623157E+308;
CONFIG.maxAccuracy = 9;
CONFIG.maxStringLength = 16384;
CONFIG.maxTitleLength =
    CONFIG.textThreshold = 256;
CONFIG.maxTitleLengthTree = 48;
CONFIG.objToGetCount = 16;
CONFIG.genIdLength = 27;
CONFIG.convertMarkdown = true;
CONFIG.addIconToType = true;
CONFIG.addIconToInstance = true;
CONFIG.fileIconStyle = 'width="24px"';
CONFIG.findMentionedObjects = true;
CONFIG.titleLinking = true;
CONFIG.titleLinkBegin = '\\[\\[';
CONFIG.titleLinkEnd = '\\]\\]([^\\]]|$)';
CONFIG.titleLinkMinLength = 3;
CONFIG.imgExtensions = ['svg', 'png', 'jpg', 'gif', 'jpeg', 'png'];
CONFIG.imgTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/jpeg', 'image/x-png'];
CONFIG.officeExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'ppsx', 'vsd', 'vsdx'];
CONFIG.officeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'application/vnd.visio', 'application/vnd/ms-visio.drawing'];
CONFIG.applExtensions = ['bpmn', 'mdzip', 'reqif', 'reqifz', 'xml', 'xsd'];
CONFIG.applTypes = ['application/bpmn+xml', 'application/xml+zip', 'application/xml', 'application/xml+zip', 'application/xml', 'text/xml'];
CONFIG.importAny =
    CONFIG.keyImport = 'import';
CONFIG.keyMode = 'mode';
CONFIG.keyFormat = 'format';
CONFIG.keyProject = 'project';
CONFIG.keyItem = 'item';
CONFIG.keyNode = 'node';
CONFIG.keyView = 'view';
CONFIG.keyOntology = 'ontology';
CONFIG.keyServer = 'server';
CONFIG.urlParamTags = [CONFIG.keyImport, CONFIG.keyMode, CONFIG.keyFormat, CONFIG.keyProject, CONFIG.keyItem, CONFIG.keyNode, CONFIG.keyView, CONFIG.keyOntology, CONFIG.keyServer];
CONFIG.projects = 'projects';
CONFIG.specifications = 'specifications';
CONFIG.objectList = 'doc';
CONFIG.objectFilter = 'filter';
CONFIG.resourceEdit = 'edit';
CONFIG.resourceLink = 'link';
CONFIG.objectDetails = 'resource';
CONFIG.objectRevisions = 'revisions';
CONFIG.relations = 'statements';
CONFIG.files = 'files';
CONFIG.comments = 'comments';
CONFIG.reports = 'reports';
CONFIG.showEmptyProperties = false;
CONFIG.propClassVisibleId =
    CONFIG.propClassId = "dcterms:identifier";
CONFIG.propClassTerm = "SpecIF:Term";
CONFIG.propClassTitle = "dcterms:title";
CONFIG.propClassDesc = "dcterms:description";
CONFIG.propClassType = "dcterms:type";
CONFIG.propClassLifecycleStatus = 'SpecIF:LifecycleStatus';
CONFIG.propClassDomain = "SpecIF:Domain";
CONFIG.propClassDiagram = 'SpecIF:Diagram';
CONFIG.propClassLocalTerm = "SpecIF:LocalTerm";
CONFIG.resClassResource = "SpecIF:Resource";
CONFIG.resClassStatement = "SpecIF:Statement";
CONFIG.resClassView = "SpecIF:View";
CONFIG.resClassXlsRow = 'XLS:Resource';
CONFIG.resClassOrganizerClass = 'pig:OrganizerClass';
CONFIG.resClassUnreferencedResources = "SpecIF:UnreferencedResources";
CONFIG.resClassHierarchyRoot = 'SpecIF:HierarchyRoot';
CONFIG.resClassOutline = 'SpecIF:Outline';
CONFIG.resClassBoM = 'SpecIF:BillOfMaterials';
CONFIG.resClassGlossary = 'SpecIF:Glossary';
CONFIG.resClassOntology = "W3C:Ontology";
CONFIG.resClassProcess = 'SpecIF:BusinessProcess';
CONFIG.resClassProcesses = 'SpecIF:BusinessProcesses';
CONFIG.resClassCondition = "SpecIF:Condition";
CONFIG.resClassRole = "SpecIF:Role";
CONFIG.resClassFolder = 'SpecIF:Heading';
CONFIG.resClassParagraph = "SpecIF:Paragraph";
CONFIG.resClassModelElement = "SpecIF:ModelElement";
CONFIG.resClassActor = "FMC:Actor";
CONFIG.resClassState = "FMC:State";
CONFIG.resClassEvent = "FMC:Event";
CONFIG.resClassComment = 'SpecIF:Comment';
CONFIG.reqifHierarchyRoot = 'ReqIF:HierarchyRoot';
CONFIG.staClassShows = 'SpecIF:shows';
CONFIG.staClassCommentRefersTo = 'SpecIF:commentRefersTo';
CONFIG.staClassMentions = 'SpecIF:mentions';
CONFIG.prefixP = "P-";
CONFIG.prefixDT = "DT-";
CONFIG.prefixPC = "PC-";
CONFIG.prefixRC = "RC-";
CONFIG.prefixSC = "SC-";
CONFIG.prefixHC = "HC-";
CONFIG.prefixHR = "HR-";
CONFIG.prefixR = "R-";
CONFIG.prefixS = "S-";
CONFIG.prefixH = "H-";
CONFIG.prefixN = "N-";
CONFIG.prefixV = "V-";
CONFIG.idProperties = [
    'dcterms:identifier',
    'dc.identifier'
];
CONFIG.titleProperties = [
    CONFIG.propClassTitle,
    "dc:title",
    "schema:name",
    CONFIG.propClassTerm
];
CONFIG.descProperties = [
    CONFIG.propClassDesc,
    CONFIG.propClassDiagram,
    "dc:description"
];
CONFIG.commentProperties = [
    "ReqIF-WF.CustomerComment",
    "ReqIF-WF.SupplierComment",
    "SpecIF:Comment"
];
CONFIG.hiddenProperties = [
    'VALUE_Table',
    'VALUE_TableType',
    'Table',
    'TableType',
    'PlainText',
    'implementerEnhanced',
    'ListNumberText'
];
CONFIG.hiddenStatements = [
    CONFIG.staClassCommentRefersTo
];
CONFIG.excludedFromTypeFiltering = [
    CONFIG.resClassComment
];
CONFIG.excludedFromDeduplication = [
    CONFIG.resClassFolder,
    CONFIG.resClassParagraph,
    CONFIG.resClassView,
    CONFIG.resClassCondition,
    "uml:Package",
    "uml:Diagram",
    "uml:Port",
    "uml:Pseudostate",
    "uml:Region",
    "uml:Transition",
    "uml:InitialNode",
    "uml:ActivityFinalNode",
    "uml:ActivityParameterNode",
    "uml:CallBehaviorAction",
    'bpmn:parallelGateway',
    'bpmn:exclusiveGateway',
    'bpmn:inclusiveGateway',
    "bpmn:eventBasedGateway",
    'bpmn:boundaryEvent',
    'bpmn:intermediateThrowEvent',
    'bpmn:intermediateCatchEvent',
    'bpmn:callActivity',
    "ArchiMate:OrJunction",
    "ArchiMate:AndJunction"
];
CONFIG.clickableModelElements = true;
CONFIG.clickElementClasses = [
    'clickEl',
    'com.arcway.cockpit.uniqueelement'
];
CONFIG.selectCorrespondingDiagramFirst = true;
CONFIG.diagramTypesHavingShowsStatementsForEdges = [
    CONFIG.resClassProcess,
    "ArchiMate:Viewpoint"
];
CONFIG.diagramClasses = [
    CONFIG.resClassView,
    CONFIG.resClassProcess,
    "ArchiMate:Viewpoint",
    "FMC:Plan"
];
CONFIG.folderClasses = [
    CONFIG.resClassOutline,
    CONFIG.resClassFolder,
    CONFIG.resClassBoM
];
CONFIG.nativeProperties = new Map([
    ["dcterms:created", { name: "createdAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["SpecIF:createdAt", { name: "createdAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["dcterms:modified", { name: "changedAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["SpecIF:changedAt", { name: "changedAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["dcterms:creator", { name: "createdBy", type: "xs:string", check: function () { return true; } }],
    ["SpecIF:createdBy", { name: "createdBy", type: "xs:string", check: function () { return true; } }],
    ["SpecIF:changedBy", { name: "changedBy", type: "xs:string", check: function () { return true; } }]
]);
CONFIG.valuesTrue = ['true', 'yes', 'wahr', 'ja', 'vrai', 'oui', '1', 'True'];
CONFIG.valuesFalse = ['false', 'no', 'falsch', 'nein', 'faux', 'non', '0', 'False'];
const RE = {};
RE.ReqifId = /^[_a-zA-Z]{1}[_a-zA-Z\d.-]*$/;
RE.SpecifId = /^[_a-zA-Z]{1}[_a-zA-Z\d.:#\/-]*$/;
RE.Email = /^[A-Z\d._%+-]+@[A-Z\d.-]+\.[A-Z]{2,4}$/i;
RE.URI = /(^|\s|>)((https?:\/\/|www\.)([^\s\/.$?#=]+\.)*([^\s\/.$?#=]+\.[\w]{2,4})((?:\/[^\s#?\/]*?){0,9})(\?[^\s#?]+?)?(#[^\s#]*?)?)(\s|,|:|<|\.\s|\.?$)/gm;
RE.IsoDateTime = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|30|31)(?:T([0-1]\d|2[0-4]):([0-5]\d):([0-5]\d(?:\.\d{1,3})?)(\+(0\d|11|12):([0-5]\d)|-(0\d|11|12):([0-5]\d)|Z)?)?$/;
RE.hasTimezone = /(Z|\+\d{2}(:\d{2})?|\-\d{2}(:\d{2})?)$/;
RE.Integer = /^(-?[1-9]\d*|0)$/;
RE.Real = function (decimals) {
    let mult = (typeof (decimals) == 'number' && decimals > 0) ? '{1,' + Math.floor(decimals) + '}' : '+';
    return new RegExp('^-?([1-9]\\d*|0)\\.\\d' + mult + '$|^(-?[1-9]\\d*|0)$', '');
};
const tagA = '<a ([^>]+)>([\\s\\S]*?)</a>', tagImg = '<img ([^>]+)/>';
RE.tagA = new RegExp(tagA, 'g');
RE.tagImg = new RegExp(tagImg, 'g');
RE.tagObject = /<object ([^>]+?)(\/>|>)/g;
RE.attrType = /type="([^"]+)"/;
RE.attrData = /data="([^"]+)"/;
const tagSO = '<object ([^>]+?)(/>|>(.*?)</object>)', tagNO = '<object ([^>]+?)>[\\s]*' + tagSO + '([\\s\\S]*?)</object>';
RE.tagSingleObject = new RegExp(tagSO, 'g');
RE.tagNestedObjects = new RegExp(tagNO, 'g');
RE.inBracketsAtEnd = /{(\S[^}]*?\S)}$/;
RE.withoutBracketsAtEnd = /^\s*([^{]+[^{\s])\s*(?:\s{1}{\S.*?\S})?$/;
RE.contentInQuotes = /"(\S[^"]*?\S)"|'(\S[^']*?\S)'/i;
RE.isolatePrefix = /^([A-Z]{1,2}-)?(\S+)/;
RE.isolateNamespace = /^([A-Z]+(?:\.|:))(\S+)/i;
const tagStr = "(<\\/?)([a-z]{1,10}(?: [^<>]+)?\\/?>)";
RE.tag = new RegExp(tagStr, 'g');
RE.innerTag = new RegExp("([\\s\\S]*?)" + tagStr, 'g');
const tagsHtml = "(p|div|object|img|a|br|b|i|em|span|ul|ol|li|table|thead|tbody|tfoot|th|td)";
RE.escapedHtmlTag = new RegExp("&(?:lt|#60);(\\/?)" + tagsHtml + "(.*?\\/?)&(?:gt|#62);", "g");
RE.innerHtmlTag = new RegExp("([\\s\\S]*?)(<\\/?)" + tagsHtml + "((?: [^<>]+)?\\/?>)", 'g');
RE.Namespace = /^([\w-]+)[.:](\w*)/;
RE.vocabularyTerm = /^[\w-]+(?:\:|\.)[\w\.:-]+$/;
RE.splitVocabularyTerm = /^([\w-]+:|[\w-]+\.)?([\w\.:-]+)$/;
RE.AmpersandPlus = new RegExp('&(.{0,8})', 'g');
RE.XMLEntity = new RegExp('&(amp|gt|lt|apos|quot|#x[\\da-fA-F]{1,4}|#\\d{1,5});/', '');
RE.versionFromPath = /\/(?:v|specif-)(\d+\.\d+)\//;
