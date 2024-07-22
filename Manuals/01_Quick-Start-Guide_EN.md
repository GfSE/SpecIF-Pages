---
title: "Quick Start Guide (EN)"
layout: default
parent: "Manuals"
nav_order: 01
---

{: .highlight }
_Acknowledgement: Parts of the text have been translated with www.DeepL.com/Translator (free version)._

# Quick Start Guide

## SpecIF Goals

SpecIF stands for "Specification Integration Facility". Process and system descriptions from various sources are brought together in an open format and can be published independently of the authoring tools.

The initiators assume that
- there will always be different tools for the disciplines involved;
- It is not sensible to oblige everyone involved to use a certain tool;
- and that there is nevertheless a high level of interest in reading, searching through and checking the work results of all those involved in a common context.

The following use cases are considered:
<ol>
  <li>System engineering collaboration in the supply chain</li>
  <ul>
    <li>Automotive: „ReqIF for system models with linked requirements“</li>
    <li>Aerospace</li>
    <li>Utilities: Planning and maintaining renewable energy parks</li>
  </ul>
  <li>Model exchange between system modeling tools</li>
  <ul>
    <li>SysML: Enterprise Architect®, Cameo®, Rhapsody® and others</li>
    <li>Other notations</li>
  </ul>
  <li>Integration of models from different notations and tools</li>
  <ul>
    <li>Navigate, search and audit partial models in a common context</li>
  </ul>
</ol>

For this purpose, SpecIF offers a cross-method and cross-manufacturer solution. Existing formats and vocabularies are used as far as possible. The motivation of the GfSE working group PLM4MBSE is summarized in a position paper <a href="http://gfse.de/Dokumente_Mitglieder/ag_ergebnisse/PLM4MBSE/PLM4MBSE_Position_paper_V_1_1.pdf" target="_blank">10 Theses about MBSE and PLM</a>.

Further information can be found on the <a href="https://specif.de" target="_blank">SpecIF homepage</a>, including motivation, examples with online demos and conference papers.

## Setup

SpecIF data can be read with a web browser (preferably Firefox, Chrome or Edge) using the SpecIF viewer or SpecIF editor. In contrast to a document, models in SpecIF format can be easily checked because they do not only contain the model elements, but also their semantic relationships.

### Install the SpecIF Viewer/Editor

#### Install Viewer/Editor on a Web-Server

Download the last released program version “specIF-apps.vX.Y.zip” from <a href="https://github.com/GfSE/SpecIF-Viewer/releases" target="_blank">GfSE/SpecIF-Viewer/releases</a>, to be found in the collapsible “assets” section, and unzip the file in the file system of the web server of your choice. Enter "http://domain.tld/path/view.html" or "http://domain.tld/path/edit.html" in the address line of your web browser to start the respective app. Of course, "domain.tld/path" has to be replaced according to your installation.

#### Use the Installed SpecIF-Viewer/Editor

If the guidelines of your network permit, you can use the <a href="https://apps.specif.de/view.html" target="_blank">SpecIF Viewer</a> or the <a href="https://apps.specif.de/edit.html" target="_blank">SpecIF Model Integrator and Editor</a>, provided for demonstration purposes. You always benefit from the latest release.

### Prepare the Model-data

Currently the formats SpecIF, ReqIF, UML/SysML (Cameo), BPMN (BPMN-XML), ArchiMate (Open-Exchange XML) and MS Excel® (XLSX. XLS and CSV) are supported.

In case of SpecIF, ReqIF, BPMN and ArchiMate, no further preparations are required; files of this type can be imported directly.

In Excel® files, meaning can be assigned to resources, statements and their attributes by applying certain conventions; see Chap. 3.

### Import a Model

The start page of the viewer / editor lets you first select the data format and gives you some specific information. Any formats other than SpecIF are converted into the SpecIF format during import.

![Import Page](../assets/images/Manuals/01_import-page_EN.png)

To import a file, after selecting the relevant type, click on ↗ **+ Select file** and the familiar file picker of your web browser will open; eligible files are filtered. Select the desired model file.

Then, click on an action button:
- ↗ **Create** loads the selected model.
- ↗ **Replace** discards previously loaded models and loads the selected one.
- ↗ **Adopt** adds the selected submodel to the already loaded one. In this case, resources that have already been imported adopt those of the new submodel if they have a compatible type and the same title; the identifier is ignored. This import mode is useful when partial models from different authoring tools are to be merged. For example, if a data object occurs in a BPMN process diagram and at the same time in an ArchiMate information model, then in the resulting semantic network the resource loaded first remains and all relations of the adopted resource are additionally adopted.
It should be noted that all attribute values of the adopted resource are lost if the corresponding one of the adopting resource already has a value. In other words: An attribute value of the adopted resource is taken over only if the adopting resource has no corresponding value.
- ↗ **Update** also adds the selected submodel to the previously loaded ones. In this case, existing resources, such as diagrams or model elements with the same identifier, are updated if the creation date of the new resource to be imported is more recent. The same applies to all other elements such as relations, files and hierarchies. For data types and classes, a check is made beforehand to ensure that the consistency of the entire semantic network is maintained. For example, it is always possible to add another attribute to a resource class, but an attribute can only be removed if no instance of the class has a value for that attribute.<br/>
The relationships of both the existing and new revisions of the model element are associated with the latter, the now current revision.

After successful loading, the view changes to "Read" resp. "Edit".

{: .highlight }
_Note: If you load data from your local file system, it will be processed locally by your web browser. The SpecIF viewer or editor does not send any user data over the Internet and does not save any user data on a server. All user data remain local in your web browser._

### Read a SpecIF Model

In the ↗ **Document** tab, the model is presented in a structure or outline chosen by the author.

![Read Page](../assets/images/Manuals/02_document-tab_EN.png)

You can open and close the structural levels on the left; the respective contents are shown on the right. In the main column, the properties designated as title, description and diagram are shown, plus any other properties in a narrow column on the right.

With certain SVG model diagrams, e.g. with FMC- or BPMN-notation created by <a href="http://arcway.com" target="_blank">ARCWAY Cockpit</a>, the diagram elements are linked to the corresponding data elements such that their title and description are displayed when the mouse is hovered over them. The element is jumped to with a double click. Here is a small <a href="https://apps.specif.de/edit#view=doc;node=N-Diagram-aec0df7900010000017001eaf53e8876;import=https://specif.de/examples/09_Very-Simple-Model-FMC-with-Requirements.specifz" target="_blank">example</a>.

### Edit a Model Element

If permissions allow, a pen icon ↗🖉 is active at the selected model element in the upper right corner. Clicking opens an editing window whose fields are determined by the current element type. Entries are checked key by key for correctness: For example, a red frame immediately indicates when a letter is entered in a number field.

Fields of type text (data type xs:string) allow formatting by means of XHTML or markdown, which is interpreted accordingly during display or document generation.

By the way, texts can also be formatted using XHTML and markdown in many authoring tools, including Excel®, Archi, Camunda Modeler and Cameo. The formatting is preserved during import.

### Investigate Semantic Relationships

In the ↗ **Relations** tab, the semantic relationships of the element selected in the outline to the left are shown. Most relationships are automatically created by graphically analyzing the model diagrams, such as “component XY contains function FR” when the block representing function FR is spatially contained in the block representing component XY. Some relationships have to be created manually as part of the analysis and system design, for example "Component XZ satisfies requirement 134".

![Read Page](../assets/images/Manuals/03_relations-tab_EN.png)

The selected element is a little darker and shown in the center of the spider. This example expresses the following dependencies:
- the "Mail Room" is shown on 4 diagrams,
- it is included in the organization "Postal Department",
- is mentioned by another element „Application Landscape“ in the text,
- itself contains several elements (please double-click the diamond so that the individual elements are shown),
- reads a document „Invoice“,
- writes a document „Invoice Document“ and finally
- sends messages to an organization „Invoice Management“.

The relationships shown are the entirety of all statements relating to the selected element in the present model. For example, if one diagram shows that component A is contained in component B and another diagram shows the opposite situation, then it is clearly a contradiction. While it is hardly possible to look through the entire model with all its diagrams and check for consistency, such contradictions are quite easily uncovered when inspecting the statements of individual elements. Current work deals with automatic model testing using hard and empirical rules in order to improve model quality in the long term.

In this view, you can also double-click any element and navigate through the semantic network using the relationships.

### Create or Delete a Relation

Likewise on tab ↗ **Relations**, two buttons for creating and deleting relations become active – if permissions are granted. 

To create a relation ↗ **＋**, a dialog box is displayed, in which a valid relation type for the given model element and a suitable target element as subject or object can be selected. Only those options are offered that correspond to the ontology, so that only meaningful semantic relations are created.

To delete a relation ↗ ❌, all relation targets of the selected model element are colored red. Double-clicking on a target element deletes the respective relation.


