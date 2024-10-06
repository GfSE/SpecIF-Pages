---
title: "Domain Classes"
layout: default
parent: "Documentation"
nav_order: 34
---

# SpecIF Domain Classes

Domain classes are generated from the SpecIF Ontology. Here, the classes of release 1.1 are listed.

## Domain 01: Base Definitions

### Data types of domain 01: Base Definitions

<table><tr><th>title</th><th>id</th><th>revision</th><th>type</th><th>description</th></tr>
<tr><td>Boolean</td><td>DT-Boolean</td><td>1.1</td><td>xs:boolean</td><td>The Boolean data type.</td></tr>
<tr><td>Byte</td><td>DT-Byte</td><td>1.1</td><td>xs:integer</td><td>A byte is an integer value between 0 and 255.</td></tr>
<tr><td>Integer</td><td>DT-Integer</td><td>1.1</td><td>xs:integer</td><td>A numerical integer value from -32768 to 32767.</td></tr>
<tr><td>Real</td><td>DT-Real</td><td>1.1</td><td>xs:double</td><td>A floating point number (double).</td></tr>
<tr><td>Real with 2 Decimals</td><td>DT-Decimal2</td><td>1.1</td><td>xs:double</td><td>A floating point number (double) with two fraction digits.</td></tr>
<tr><td>Date or Timestamp</td><td>DT-DateTime</td><td>1.1</td><td>xs:dateTime</td><td>Date or timestamp in ISO-format</td></tr>
<tr><td>String[256]</td><td>DT-ShortString</td><td>1.1</td><td>xs:string</td><td>String with max. length 256</td></tr>
<tr><td>Plain or formatted Text</td><td>DT-Text</td><td>1.1</td><td>xs:string</td><td>An account of the resource (source: http://dublincore.org/documents/dcmi-terms/). Descriptive text represented in plain or rich text using XHTML. SHOULD include only content that is valid and suitable inside an XHTML &lt;div&gt; element (source: http://open-services.net/).</td></tr>
<tr><td>URL</td><td>DT-URL</td><td>1.1</td><td>xs:string</td><td>A uniform resource locator.</td></tr>
<tr><td>E-mail</td><td>DT-EmailAddress</td><td>1.1</td><td>xs:string</td><td>Data type to represent an e-mail address.</td></tr>
<tr><td>SpecIF:LifeCycleStatus</td><td>DT-LifeCycleStatus</td><td>1.1</td><td>xs:string</td><td><p>Enumerated values for status</p><ul><li>SpecIF:LifecycleStatusDeprecated [V-Status-0]</li><li>SpecIF:LifecycleStatusRejected [V-Status-1]</li><li>SpecIF:LifecycleStatusInitial [V-Status-2]</li><li>SpecIF:LifecycleStatusDrafted [V-Status-3]</li><li>SpecIF:LifecycleStatusSubmitted [V-Status-4]</li><li>SpecIF:LifecycleStatusApproved [V-Status-5]</li><li>SpecIF:LifecycleStatusReady [V-Status-8]</li><li>SpecIF:LifecycleStatusDone [V-Status-6]</li><li>SpecIF:LifecycleStatusValidated [V-Status-9]</li><li>SpecIF:LifecycleStatusReleased [V-Status-7]</li><li>SpecIF:LifecycleStatusWithdrawn [V-Status-10]</li></ul></td></tr>
<tr><td>SpecIF:Priority</td><td>DT-Priority</td><td>1.1</td><td>xs:string</td><td><p>Enumerated values for priority</p><ul><li>SpecIF:priorityHigh [V-Prio-0]</li><li>SpecIF:priorityRatherHigh [V-Prio-1]</li><li>SpecIF:priorityMedium [V-Prio-2]</li><li>SpecIF:priorityRatherLow [V-Prio-3]</li><li>SpecIF:priorityLow [V-Prio-4]</li></ul></td></tr>
<tr><td>SpecIF:Discipline</td><td>DT-Discipline</td><td>1.1</td><td>xs:string</td><td><p>Enumerated values for engineering discipline</p><ul><li>SpecIF:DisciplineSystem [V-discipline-4]</li><li>SpecIF:DisciplineMechanics [V-discipline-0]</li><li>SpecIF:DisciplineElectronics [V-discipline-1]</li><li>SpecIF:DisciplineSoftware [V-discipline-2]</li><li>SpecIF:DisciplineSafety [V-discipline-3]</li></ul></td></tr>
</table>

### Property classes of domain 01: Base Definitions

<table><tr><th>title</th><th>id</th><th>revision</th><th>dataType</th><th>description</th></tr>
<tr><td>dcterms:identifier</td><td>PC-VisibleId</td><td>1.1</td><td>String[256]</td><td><p>A unique reference to the resource within a given context. <small>(<i>source: <a href="http://dublincore.org/documents/dcmi-terms/">DCMI</a></i>)</small></p><p>An identifier for a resource. This identifier may be unique with a scope that is defined by the RM provider. Assigned by the service provider when a resource is created. Not intended for end-user display. <small>(<i>source: <a href="http://open-services.net/">OSLC</a></i>)</small></p></td></tr>
<tr><td>dcterms:title</td><td>PC-Name</td><td>1.1</td><td>String[256]</td><td><p>A name given to the resource. <small>(<i>source: <a href="http://dublincore.org/documents/dcmi-terms/">DCMI</a></i>)</small></p><p>Title (reference: Dublin Core) of the resource represented as rich text in XHTML content. SHOULD include only content that is valid inside an XHTML &lt;span&gt; element. <small>(<i>source: <a href="http://open-services.net/">OSLC</a></i>)</small></p></td></tr>
<tr><td>dcterms:description</td><td>PC-Description</td><td>1.1</td><td>Plain or formatted Text</td><td><p>An account of the resource. <small>(<i>source: <a href="http://dublincore.org/documents/dcmi-terms/">DCMI</a></i>)</small></p><p>Descriptive text (reference: Dublin Core) about resource represented as rich text in XHTML content. SHOULD include only content that is valid and suitable inside an XHTML &lt;div&gt; element. <small>(<i>source: <a href="http://open-services.net/">OSLC</a></i>)</small></p></td></tr>
<tr><td>SpecIF:Origin</td><td>PC-Origin</td><td>1.1</td><td>String[256]</td><td>The origin (source, reference) of an information or requirement.</td></tr>
<tr><td>SpecIF:Diagram</td><td>PC-Diagram</td><td>1.1</td><td>Plain or formatted Text</td><td>A partial graphical representation (diagram) of a model.</td></tr>
<tr><td>SpecIF:Notation</td><td>PC-Notation</td><td>1.1</td><td>String[256]</td><td>The notation used by a model diagram, e.g. 'BPMN:2.0', 'OMG:SysML:1.3:Activity Diagram' or 'FMC:Block Diagram'.</td></tr>
<tr><td>SpecIF:LifeCycleStatus</td><td>PC-LifeCycleStatus</td><td>1.1</td><td>SpecIF:LifeCycleStatus</td><td>The 'status', e.g. lifecycle state, of the resource.</td></tr>
<tr><td>SpecIF:Priority</td><td>PC-Priority</td><td>1.1</td><td>SpecIF:Priority</td><td>The 'priority' of the resource.</td></tr>
<tr><td>SpecIF:Discipline</td><td>PC-Discipline</td><td>1.1</td><td>SpecIF:Discipline</td><td>The engineering discipline (system, electronics, mechanics, software, safety).</td></tr>
<tr><td>SpecIF:Responsible</td><td>PC-Responsible</td><td>1.1</td><td>String[256]</td><td>The 'person' being responsible for the resource.</td></tr>
<tr><td>SpecIF:DueDate</td><td>PC-DueDate</td><td>1.1</td><td>Date or Timestamp</td><td>A 'due date' for the resource.</td></tr>
<tr><td>UML:Stereotype</td><td>PC-Stereotype</td><td>1.1</td><td>String[256]</td><td>A stereotype gives an element an additional/different meaning.</td></tr>
<tr><td>SpecIF:Abbreviation</td><td>PC-Abbreviation</td><td>1.1</td><td>String[256]</td><td>An abbreviation for the resource or statement.</td></tr>
<tr><td>dcterms:type</td><td>PC-Type</td><td>1.1</td><td>String[256]</td><td>The element type resp. the metamodel element (e.g. OMG:UML:2.5.1:Class)</td></tr>
<tr><td>SpecIF:Alias</td><td>PC-Alias</td><td>1.1</td><td>String[256]</td><td>An alias name for the resource.</td></tr>
<tr><td>rdf:value</td><td>PC-Value</td><td>1.1</td><td>Plain or formatted Text</td><td>A value of different meaning, depending on the element type (attribute default value, a taggedValue value etc.).</td></tr>
</table>

### Resource classes of domain 01: Base Definitions

<table><tr><th>title</th><th>id</th><th>revision</th><th>description</th></tr>
<tr><td>SpecIF:Heading</td><td>RC-Folder</td><td>1.1</td><td><p>Folders with title and text for chapters or descriptive paragraphs.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>dcterms:type [PC-Type 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:Paragraph</td><td>RC-Paragraph</td><td>1.1</td><td><p>Information with text for descriptive paragraphs.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:Hierarchy</td><td>RC-Hierarchy</td><td>1.1</td><td><p>Root node of a hierarchically organized specification (outline).</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:Comment</td><td>RC-Comment</td><td>1.1</td><td><p>Comment referring to a model element ('resource' or 'statement' in general).</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li></ul></p></td></tr>
</table>

### Statement classes of domain 01: Base Definitions

<table><tr><th>title</th><th>id</th><th>revision</th><th>description</th></tr>
<tr><td>rdf:type</td><td>SC-Classifier</td><td>1.1</td><td><p>States that the relation subject is an instance of the relation object.</p></td></tr>
<tr><td>SpecIF:refersTo</td><td>SC-refersTo</td><td>1.1</td><td><p>A resource 'refers to' any other resource.</p><p>Property classes:<br/><ul><li>dcterms:type [PC-Type 1.1]</li></ul></p></td></tr>
</table>

## Domain 02: Requirements Engineering

### Data types of domain 02: Requirements Engineering

<table><tr><th>title</th><th>id</th><th>revision</th><th>type</th><th>description</th></tr>
<tr><td>IREB:RequirementType</td><td>DT-RequirementType</td><td>1.1</td><td>xs:string</td><td><p>Enumerated values for the requirement type according to IREB.</p><ul><li>IREB:FunctionalRequirement [V-RequirementType-0]</li><li>IREB:QualityRequirement [V-RequirementType-1]</li><li>IREB:Constraint [V-RequirementType-2]</li></ul></td></tr>
<tr><td>Perspective</td><td>DT-Perspective</td><td>1.1</td><td>xs:string</td><td><p>Enumerated values for the perspective (of a requirement)</p><ul><li>IREB:PerspectiveBusiness [V-perspective-0]</li><li>IREB:PerspectiveStakeholder [V-perspective-3]</li><li>IREB:PerspectiveUser [V-perspective-1]</li><li>IREB:PerspectiveOperator [V-perspective-4]</li><li>IREB:PerspectiveSystem [V-perspective-2]</li></ul></td></tr>
</table>

### Property classes of domain 02: Requirements Engineering

<table><tr><th>title</th><th>id</th><th>revision</th><th>dataType</th><th>description</th></tr>
<tr><td>IREB:RequirementType</td><td>PC-RequirementType</td><td>1.1</td><td>IREB:RequirementType</td><td>Enumerated value for the requirement type according to IREB.</td></tr>
<tr><td>SpecIF:Perspective</td><td>PC-Perspective</td><td>1.1</td><td>Perspective</td><td>Enumerated values for the perspective (of a requirement).</td></tr>
</table>

### Resource classes of domain 02: Requirements Engineering

<table><tr><th>title</th><th>id</th><th>revision</th><th>description</th></tr>
<tr><td>IREB:Requirement</td><td>RC-Requirement</td><td>1.1</td><td><p>A 'requirement' is a singular documented physical and functional need that a particular design, product or process must be able to perform.</p><p>Property classes:<br/><ul><li>dcterms:identifier [PC-VisibleId 1.1]</li><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>IREB:RequirementType [PC-RequirementType 1.1]</li><li>SpecIF:Priority [PC-Priority 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>SpecIF:Perspective [PC-Perspective 1.1]</li><li>SpecIF:Discipline [PC-Discipline 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:Feature</td><td>RC-Feature</td><td>1.1</td><td><p>A 'feature' is an intentional distinguishing characteristic of a system, often a unique selling proposition.</p><p>Property classes:<br/><ul><li>dcterms:identifier [PC-VisibleId 1.1]</li><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>SpecIF:Priority [PC-Priority 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>SpecIF:Perspective [PC-Perspective 1.1]</li><li>SpecIF:Discipline [PC-Discipline 1.1]</li></ul></p></td></tr>
</table>

### Statement classes of domain 02: Requirements Engineering

<table><tr><th>title</th><th>id</th><th>revision</th><th>description</th></tr>
<tr><td>SpecIF:dependsOn</td><td>SC-dependsOn</td><td>1.1</td><td><p>Statement: Requirement/feature depends on requirement/feature.</p></td></tr>
<tr><td>SpecIF:duplicates</td><td>SC-duplicates</td><td>1.1</td><td><p>The subject requirement duplicates the object requirement.</p></td></tr>
<tr><td>SpecIF:contradicts</td><td>SC-contradicts</td><td>1.1</td><td><p>The subject requirement contradicts the object requirement.</p></td></tr>
<tr><td>IREB:refines</td><td>SC-refines</td><td>1.1</td><td><p>The subject requirement refines the object requirement.</p></td></tr>
</table>

## Domain 03: Model Integration

### Data types of domain 03: Model Integration

<table><tr><th>title</th><th>id</th><th>revision</th><th>type</th><th>description</th></tr>
<tr><td>SpecIF:VisibilityKind</td><td>DT-VisibilityKind</td><td>1.1</td><td>xs:string</td><td><p>Enumerated values for visibility.</p><ul><li>UML:Public [V-VisibilityKind-0]</li><li>UML:Private [V-VisibilityKind-1]</li><li>UML:Protected [V-VisibilityKind-2]</li><li>UML:Package [V-VisibilityKind-3]</li><li>UML:Internal [V-VisibilityKind-4]</li><li>UML:ProtectedInternal [V-VisibilityKind-5]</li></ul></td></tr>
</table>

### Property classes of domain 03: Model Integration

<table><tr><th>title</th><th>id</th><th>revision</th><th>dataType</th><th>description</th></tr>
<tr><td>SpecIF:Visibility</td><td>PC-Visibility</td><td>1.1</td><td>SpecIF:VisibilityKind</td><td>The visibility of a resource (e.g. public, private, protected,...) as known from object orientation.</td></tr>
<tr><td>SpecIF:ImplementationLanguage</td><td>PC-ImplementationLanguage</td><td>1.1</td><td>String[256]</td><td>The name of an used implementation language (e.g. C, C++, C#, Java, ADA, OCL, ALF etc.).</td></tr>
</table>

### Resource classes of domain 03: Model Integration

<table><tr><th>title</th><th>id</th><th>revision</th><th>description</th></tr>
<tr><td>UML:Package</td><td>RC-Package</td><td>1.1</td><td><p>A 'package' is used to bring structure into a model. Packages can contain further packages and/or (model-)elements. It corresponds to a package in UML/SysML or a folder in a file system.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>SpecIF:Visibility [PC-Visibility 1.1]</li><li>dcterms:type [PC-Type 1.1]</li><li>UML:Stereotype [PC-Stereotype 1.1]</li><li>rdf:value [PC-Value 1.1]</li><li>SpecIF:Alias [PC-Alias 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:Diagram</td><td>RC-Diagram</td><td>1.1</td><td><p>A 'diagram' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>SpecIF:Diagram [PC-Diagram 1.1]</li><li>dcterms:type [PC-Type 1.1]</li><li>SpecIF:Notation [PC-Notation 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>UML:Stereotype [PC-Stereotype 1.1]</li></ul></p></td></tr>
<tr><td>FMC:Actor</td><td>RC-Actor</td><td>1.1</td><td><p>An 'actor' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>SpecIF:Visibility [PC-Visibility 1.1]</li><li>dcterms:type [PC-Type 1.1]</li><li>UML:Stereotype [PC-Stereotype 1.1]</li><li>rdf:value [PC-Value 1.1]</li><li>SpecIF:Alias [PC-Alias 1.1]</li></ul></p></td></tr>
<tr><td>FMC:State</td><td>RC-State</td><td>1.1</td><td><p>A 'state' is a fundamental model element type representing a passive entity, be it a value, a condition, an information storage or even a physical shape.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>SpecIF:Visibility [PC-Visibility 1.1]</li><li>dcterms:type [PC-Type 1.1]</li><li>UML:Stereotype [PC-Stereotype 1.1]</li><li>rdf:value [PC-Value 1.1]</li><li>SpecIF:Alias [PC-Alias 1.1]</li></ul></p></td></tr>
<tr><td>FMC:Event</td><td>RC-Event</td><td>1.1</td><td><p>An 'event' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronization primitive.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>SpecIF:Visibility [PC-Visibility 1.1]</li><li>dcterms:type [PC-Type 1.1]</li><li>UML:Stereotype [PC-Stereotype 1.1]</li><li>rdf:value [PC-Value 1.1]</li><li>SpecIF:Alias [PC-Alias 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:Collection</td><td>RC-Collection</td><td>1.1</td><td><p>A 'collection' is a logic (often conceptual) group of resources linked with a SpecIF:contains statement. It corresponds to a 'group' in BPMN diagrams or a 'boundary' in UML diagrams.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>dcterms:description [PC-Description 1.1]</li><li>SpecIF:LifeCycleStatus [PC-LifeCycleStatus 1.1]</li><li>SpecIF:Visibility [PC-Visibility 1.1]</li><li>dcterms:type [PC-Type 1.1]</li><li>UML:Stereotype [PC-Stereotype 1.1]</li><li>rdf:value [PC-Value 1.1]</li><li>SpecIF:Alias [PC-Alias 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:SourceCode</td><td>RC-SourceCode</td><td>1.1</td><td><p>Source code assigned to a model element (e.g. an activity or operation). Typically used for model-based code generation to provide some code snippets inside the model.</p><p>Property classes:<br/><ul><li>dcterms:title [PC-Name 1.1]</li><li>SpecIF:ImplementationLanguage [PC-ImplementationLanguage 1.1]</li><li>rdf:value [PC-Value 1.1]</li></ul></p></td></tr>
</table>

### Statement classes of domain 03: Model Integration

<table><tr><th>title</th><th>id</th><th>revision</th><th>description</th></tr>
<tr><td>SpecIF:shows</td><td>SC-shows</td><td>1.1</td><td><p>Statement: Plan resp. diagram shows model element.</p></td></tr>
<tr><td>SpecIF:contains</td><td>SC-contains</td><td>1.1</td><td><p>Statement: Model element contains model element.</p></td></tr>
<tr><td>SpecIF:serves</td><td>SC-serves</td><td>1.1</td><td><p>Statement: An actor serves an actor.</p></td></tr>
<tr><td>SpecIF:stores</td><td>SC-stores</td><td>1.1</td><td><p>Statement: Actor (role, function) writes and reads state (information).</p></td></tr>
<tr><td>SpecIF:writes</td><td>SC-writes</td><td>1.1</td><td><p>Statement: Actor (role, function) writes state (information).</p></td></tr>
<tr><td>SpecIF:reads</td><td>SC-reads</td><td>1.1</td><td><p>Statement: Actor (role, function) reads state (information).</p></td></tr>
<tr><td>SpecIF:influences</td><td>SC-influences</td><td>1.1</td><td><p>Statement: A state (information) influences a state (information).</p></td></tr>
<tr><td>SpecIF:precedes</td><td>SC-precedes</td><td>1.1</td><td><p>An FMC:Actor 'precedes' an FMC:Actor or an FMC:Actor 'precedes' an FMC:Event or an FMC:Event 'precedes' an FMC:Actor. The rdf:type property specifies if it is a simple precedes, a SpecIF:signals or a SpecIF:triggers.</p><p>Property classes:<br/><ul><li>dcterms:type [PC-Type 1.1]</li></ul></p></td></tr>
<tr><td>oslc_rm:satisfies</td><td>SC-satisfies</td><td>1.1</td><td><p>Statement: Model element satisfies requirement.</p></td></tr>
<tr><td>SpecIF:allocates</td><td>SC-allocates</td><td>1.1</td><td><p>Statement: Model element is allocated to model element. The semantics are equal to allocation in SysML or deployment relation in UML.</p></td></tr>
<tr><td>SpecIF:implements</td><td>SC-implements</td><td>1.1</td><td><p>A FMC:Actor or FMC:State 'implements' a SpecIF:Feature.</p></td></tr>
<tr><td>SpecIF:isAssociatedWith</td><td>SC-isAssociatedWith</td><td>1.1</td><td><p>The subject is associated with the object.</p><p>Property classes:<br/><ul><li>dcterms:type [PC-Type 1.1]</li></ul></p></td></tr>
<tr><td>SpecIF:isSpecializationOf</td><td>SC-isSpecializationOf</td><td>1.0</td><td><p>A term is a specialization of another, such as 'Passenger Car' and 'Vehicle'.</p></td></tr>
</table>
