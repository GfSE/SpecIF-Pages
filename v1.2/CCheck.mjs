export class CCheck{constructor(){this.ajv=new Ajv({allErrors:!0}),this.regex={IsoDateTime:/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|30|31)(?:T([0-1]\d|2[0-4]):([0-5]\d):([0-5]\d(?:\.\d{1,3})?)(\+(0\d|11|12):([0-5]\d)|-(0\d|11|12):([0-5]\d)|Z)?)?$/}}checkSchema(t,e){if(!e||!e.schema)throw Error("checkSchema options: a schema must be supplied");let s=this.ajv.compile(e.schema);return s(t)?{status:0,statusText:"SpecIF schema has been checked successfully!"}:{status:970,statusText:"SpecIF schema is violated",responseType:"text",responseText:this.ajv.errorsText(s.errors)}}checkConstraints(t,e){if(!t.$schema)return{status:971,statusText:"This constraint checker does not support any SpecIF version below 1.1"};switch(t.$schema){case"https://specif.de/v1.2/schema.json":case"https://json.schemastore.org/specif-1.2.json":break;case"https://specif.de/v1.0/schema.json":case"https://json.schemastore.org/specif-1.0.json":return{status:971,statusText:"This constraint checker does not support SpecIF version 1.0"};case"https://specif.de/v1.1/schema.json":case"https://json.schemastore.org/specif-1.1.json":return{status:971,statusText:"This constraint checker does not support SpecIF version 1.1"};default:return{status:972,statusText:"Invalid schema location"}}"object"!=typeof e&&(e={}),Array.isArray(e.doCheck)||(e.doCheck=[]),Array.isArray(e.dontCheck)||(e.dontCheck=[]);let s=this,a="resourceClasses",r="statementClasses",n="propertyClasses",i="class",u="class",o="class",c="nodes",l="subjectClasses",h="objectClasses",f="minInclusive",p="maxInclusive";var d,m,y=[];return function(){function e(t){if(Array.isArray(t)&&t.length>0){function n(t,e){let s,a=e.revision||"";for(var r=t.length-1;r>-1;r--)if(s=t[r].revision||"",t[r].id==e.id&&(s==a||""==s||""==a))return!0;return!1}for(var a,r=t.length-1;r>-1;r--)if(null!=t[r].id){if(n(s,t[r]))return t[r];if(a=e(t[r].enumeration))return a;if(a=e(t[r].nodes))return a;s.push(b(t[r]))}}}let s=[b(t)];[{list:t.dataTypes,name:"dataType or enumerated value"},{list:t[n],name:"propertyClass"},{list:t[a],name:"resourceClass"},{list:t[r],name:"statementClass"},{list:t.resources,name:"resource"},{list:t.statements,name:"statement"},{list:t[c],name:"node"},{list:t.files,name:"file"}].forEach((function(t){let s=e(t.list);s&&y.push({status:973,statusText:"key of "+t.name+" '"+s.id+"' with revision "+s.revision+" is not unique"})}))}(),t.dataTypes.forEach((function(t){switch(t.type){case"xs:double":case"xs:integer":"number"==typeof t[f]&&"number"==typeof t[p]&&t[f]+1>t[p]&&y.push({status:974,statusText:"dataType '"+t.id+"': "+f+" must be smaller or equal than "+p});case"xs:dateTime":case"xs:anyURI":case"xs:string":if(Array.isArray(t.enumeration))if(t.enumeration.length>0)for(var e=t.enumeration.length-1;e>-1;e--)"xs:string"==t.type?C(t.enumeration[e].value)||y.push({status:974,statusText:"dataType '"+t.id+"' of type 'xs:string' must have enumerated values, each with a list of multi-language texts"}):"string"!=typeof t.enumeration[e].value&&y.push({status:974,statusText:"dataType '"+t.id+"' of type '"+t.type+"' must have enumerated string values"});else y.push({status:974,statusText:"dataType '"+t.id+"' must have at least one enumerated value"})}})),t[n].forEach((function(e){j(t.dataTypes,e.dataType)&&y.push({status:975,statusText:"property class with identifier '"+e.id+"' must reference a valid dataType"}),T(e,e.values,"property class '"+e.id+"'")})),t[a].forEach((function(t){v(t,"resourceClass")})),x(t[a],t[a],"extends","resourceClass"),function(){let s=t[a].concat(t[r]);t[r].forEach((function(t){v(t),[l,h].forEach((function(a){var r;e.doCheck.includes("statementClass."+a)&&(r=t[a],Array.isArray(r)&&r.length<1&&y.push({status:978,statusText:a+" of "+u+" '"+t.id+"' must reference at least one valid resourceClass or statementClass"}),function(t,e){if(Array.isArray(e))for(var s=e.length-1;s>-1;s--)if(j(t,e[s]))return!0;return!1}(s,t[a])&&y.push({status:978,statusText:a+" of "+u+" '"+t.id+"' references at least one invalid resourceClass or statementClass"}))}))})),x(t[r],t[r],"extends","statementClass")}(),x(t[a],t.resources,i,"resourceClass"),g(t[a],t.resources,i),function(){x(t[r],t.statements,u,"statementClass");let s=t.resources.concat(t.statements),n=t[a].concat(t[r]);t.statements.forEach((function(a,o){let c=A(s,a.subject),f=A(s,a.object);!c&&e.dontCheck.indexOf("statement.subject")<0&&y.push({status:980,statusText:"subject of statement["+o+"] with identifier '"+a.id+"' must reference a valid resource or statement"}),!f&&e.dontCheck.indexOf("statement.object")<0&&y.push({status:980,statusText:"object of statement["+o+"] with identifier '"+a.id+"' must reference a valid resource or statement"}),c&&f&&c.id==f.id&&c.revision!=f.revision&&y.push({status:980,statusText:"subject and object of statement["+o+"] with identifier '"+a.id+"' may have the same id, but not of different revisions"});let p=A(t[r],a[u]);if(p){if(Array.isArray(p[l])&&c){let t=[];p[l].forEach((function(e){let s=A(n,e);s&&t.push(s)})),j(t,c[i])&&y.push({status:981,statusText:"the subject of statement["+o+"] with identifier '"+a.id+"' has a class which is not listed in the "+l+" of the statement's class"})}if(Array.isArray(p[h])&&f){let t=[];p[h].forEach((function(e){let s=A(n,e);s&&t.push(s)})),j(t,f[[i]])&&y.push({status:981,statusText:"the object of statement["+o+"] with identifier '"+a.id+"' has a class which is not listed in the "+h+" of the statement's class"})}}})),g(t[r],t.statements,u)}(),function t(e,s,a){Array.isArray(s)&&s.forEach((function(s){j(e,s.resource)&&y.push({status:988,statusText:"hierarchy node with identifier '"+s.id+"' must reference a valid resource"}),t(e,s.nodes,a+1)}))}(t.resources,t[c],0),y.length<1?{status:0,statusText:"SpecIF constraints have been checked successfully!"}:{status:973,statusText:"SpecIF constraints are violated",responseType:"text",responseText:(d=y,m="",d.forEach((function(t){m+=(m.length?",\n":"")+t.statusText+" ("+status+")"})),m)};function v(e,s){Array.isArray(e[n])&&("resourceClass"==s&&!e.extends&&e[n].length<1&&y.push({status:976,statusText:"resource class '"+e.id+"' must have at least one property class"}),e[n].forEach((function(s){j(t.propertyClasses,s)&&y.push({status:977,statusText:"property class '"+s.id+"' of element '"+e.id+"' must reference an item in 'propertyClasses'"})})))}function x(t,e,s,a){e.forEach((function(e){e[s]&&j(t,e[s])&&y.push({status:979,statusText:"key '"+s+"' of item '"+e.id+"' must reference a valid "+a}),Array.isArray(e.instantiation)&&e.instantiation.includes("never")&&e.instantiation.length>1&&y.push({status:979,statusText:"Attribute 'instantiation' of item '"+e.id+"' must not include another value, if 'never' is present"})}))}function T(a,r,n){let i=A(t.dataTypes,a.dataType);i&&Array.isArray(r)&&(!a.multiple&&r.length>1&&y.push({status:983,statusText:n+": propertyClass does not allow multiple values"}),r.forEach((function(t){if(Array.isArray(i.enumeration)){if("object"!=typeof t||!t.id||j(i.enumeration,t))return void y.push({status:984,statusText:n+": all values must be an id of the dataTypes' value enumeration"})}else{if("xs:string"===i.type){if(!C(t))return void y.push({status:985,statusText:n+": all values must be a list (of multi-language objects)"})}else if("string"!=typeof t)return void y.push({status:985,statusText:n+": all values must be a string"});switch(i.type){case"xs:boolean":"true"!=t&&"false"!=t&&y.push({status:986,statusText:n+": boolean value is invalid"});break;case"xs:dateTime":s.regex.IsoDateTime.test(t)||y.push({status:986,statusText:n+": value must be a valid date-time string according to ISO 8601"});break;case"xs:duration":break;case"xs:anyURI":s.checkSchema({value:t},{schema:{$id:"https://specif.de/v1.1/anyURI/schema#",$schema:"http://json-schema.org/draft-04/schema#",type:"object",properties:{value:{type:"string",format:"uri"}}}}).status>0&&y.push({status:986,statusText:n+": value must be a valid URI string according to RFC 3986"});break;case"xs:integer":t=parseInt(t),isNaN(t)&&y.push({status:986,statusText:n+": value is not a valid number"}),i[f]&&t<i[f]&&y.push({status:986,statusText:n+": integer value must be larger than "+i[f]}),i[p]&&t>i[p]&&y.push({status:986,statusText:n+": integer value must be smaller than "+i[p]});break;case"xs:double":t=parseFloat(t),isNaN(t)&&y.push({status:986,statusText:n+": value is not a valid number"}),i[f]&&t<i[f]&&y.push({status:986,statusText:n+": double value must be larger than "+i[f]}),i[p]&&t>i[p]&&y.push({status:986,statusText:n+": double value must be smaller than "+i[p]});break;case"xs:string":Array.isArray(t)?"number"==typeof i.maxLength&&e.dontCheck.indexOf("text.length")<0&&t.forEach((function(t){t.text.length>i.maxLength&&e.dontCheck.indexOf("text.length")<0&&y.push({status:986,statusText:n+": length of string value must not exceed "+i.maxLength})})):y.push({status:986,statusText:n+": value must be a list of multi-language objects"})}}})))}function g(e,s,a){s.forEach((function(s){let r,n,i=[],u=A(e,s[a]);u&&(!function t(s){s&&(i=i.concat(s.propertyClasses||[]),"object"==typeof s.extends&&t(A(e,s.extends)))}(u),Array.isArray(s.properties)&&s.properties.forEach((function(e){r="property with class '"+e[o].id+"' of instance with identifier '"+s.id+"'",j(i,e[o])&&y.push({status:987,statusText:r+": class must be listed with the instance class or a parent instance class"}),n=A(t.propertyClasses,e[o]),"object"==typeof n?T(n,e.values,r):y.push({status:987,statusText:r+" must reference a valid propertyClass"})})))}))}function b(t){return{id:t.id,revision:t.revision}}function C(t){if(Array.isArray(t)){let s=t.length>1;for(var e=t.length-1;e>-1;e--){let a=t[e];if("string"!=typeof a.text||s&&e>0&&("string"!=typeof a.language||a.language.length<2))return!1}return!0}return!1}function A(t,e){let s=t.filter((function(t){return t.id==e.id}));if(s.length<1)return;if(1==s.length&&!s[0].revision){if(e.revision)return;return s[0]}if(s.sort((function(t,e){return e.changedAt-t.changedAt})),!e.revision)return s[0];let a=s.filter((function(t){return t.revision==e.revision}));return a.length>0?a[0]:void 0}function j(t,e){return null==A(t,e)}}}