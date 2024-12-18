"use strict";
const CONFIG = {};
CONFIG.appVersion = "1.1.r.27",
    CONFIG.specifVersion = "1.1";
CONFIG.imgURL = './assets/images';
CONFIG.ontologyURL = 'https://specif.de/v1.1/Ontology.specif';
CONFIG.QuickStartGuideDe = "https://specif.de/downloads/SpecIF-Einfuehrung.pdf";
CONFIG.QuickStartGuideEn = "https://specif.de/Manuals/01_Quick-Start-Guide_EN.html";
CONFIG.userNameAnonymous = 'Anonymous';
CONFIG.passwordAnonymous = '';
CONFIG.placeholder = 'to-be-replaced';
CONFIG.notAssigned = 'notAssigned';
CONFIG.messageDisplayTimeShort = 4000;
CONFIG.messageDisplayTimeNormal = 8000;
CONFIG.messageDisplayTimeLong = 12000;
CONFIG.noMultipleRefreshWithin = 320;
CONFIG.imageRenderingTimelag = 320;
CONFIG.showTimelag = 400;
CONFIG.minInteger = -2147483648;
CONFIG.maxInteger = 2147483647;
CONFIG.minReal = -1.7976931348623157E+308;
CONFIG.maxReal = 1.7976931348623157E+308;
CONFIG.maxAccuracy = 9;
CONFIG.maxStringLength = 16384;
CONFIG.maxTitleLength =
    CONFIG.textThreshold = 256;
CONFIG.treeMaxTitleLength = 48;
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
CONFIG.focusColor = '#1690D8';
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
CONFIG.urlParamTags = [CONFIG.keyImport, CONFIG.keyMode, CONFIG.keyFormat, CONFIG.keyProject, CONFIG.keyItem, CONFIG.keyNode, CONFIG.keyView];
CONFIG.project = 'project';
CONFIG.projects = 'projects';
CONFIG.specification = 'specification';
CONFIG.specifications = 'specifications';
CONFIG.object = 'resource';
CONFIG.objects = 'resources';
CONFIG.objectTable = 'table';
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
const RE = {};
RE.Id = /^[_a-zA-Z]{1}[_a-zA-Z\d.-]*$/;
RE.Email = /^[A-Z\d._%+-]+@[A-Z\d.-]+\.[A-Z]{2,4}$/i;
RE.URI = /(^|\s|>)((https?:\/\/|www\.)([^\s\/.$?#=]+\.)*([^\s\/.$?#=]+\.[\w]{2,4})(\/[^\s\?#]*?)*(\?[^\s#]+?)?(#\S*?)?)(\s|,|:|<|\.\s|\.?$)/gm;
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
RE.inQuotes = /"(\S[^"]*?\S)"|'(\S[^']*?\S)'/i;
RE.isolatePrefix = /^([A-Z]{1,2}-)?(\S+)/;
RE.isolateNamespace = /^([A-Z]+(?:\.|:))(\S+)/i;
const tagStr = "(<\\/?)([a-z]{1,10}(?: [^<>]+)?\\/?>)";
RE.tag = new RegExp(tagStr, 'g');
RE.innerTag = new RegExp("([\\s\\S]*?)" + tagStr, 'g');
const tagsHtml = "(p|div|object|img|a|br|b|i|em|span|ul|ol|li|table|thead|tbody|tfoot|th|td)";
RE.escapedHtmlTag = new RegExp("&(?:lt|#60);(\\/?)" + tagsHtml + "(.*?\\/?)&(?:gt|#62);", "g");
RE.innerHtmlTag = new RegExp("([\\s\\S]*?)(<\\/?)" + tagsHtml + "((?: [^<>]+)?\\/?>)", 'g');
RE.Namespace = /^([\w-]+)[.:](\w)/;
RE.vocabularyTerm = /^[\w-]+(?:\:|\.)[\w\.:-]+$/;
RE.splitVocabularyTerm = /^([\w-]+:|[\w-]+\.)?([\w\.:-]+)$/;
RE.AmpersandPlus = new RegExp('&(.{0,8})', 'g');
RE.XMLEntity = new RegExp('&(amp|gt|lt|apos|quot|#x[\\da-fA-F]{1,4}|#\\d{1,5});/', '');
