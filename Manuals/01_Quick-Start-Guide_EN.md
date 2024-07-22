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

![Import Page](01-import-page.png)

To import a file, after selecting the relevant type, click on ↗**+ Select file** and the familiar file picker of your web browser will open; eligible files are filtered. Select the desired model file.

Then, click on an action button:
- ↗[Create] loads the selected model.
- ↗ Replace discards previously loaded models and loads the selected one.
- ↗ Adopt adds the selected submodel to the already loaded one. In this case, resources that have already been imported adopt those of the new submodel if they have a compatible type and the same title; the identifier is ignored. This import mode is useful when partial models from different authoring tools are to be merged. For example, if a data object occurs in a BPMN process diagram and at the same time in an ArchiMate information model, then in the resulting semantic network the resource loaded first remains and all relations of the adopted resource are additionally adopted.
It should be noted that all attribute values of the adopted resource are lost if the corresponding one of the adopting resource already has a value. In other words: An attribute value of the adopted resource is taken over only if the adopting resource has no corresponding value.
- ↗ Update also adds the selected submodel to the previously loaded ones. In this case, existing resources, such as diagrams or model elements with the same identifier, are updated if the creation date of the new resource to be imported is more recent. The same applies to all other elements such as relations, files and hierarchies. For data types and classes, a check is made beforehand to ensure that the consistency of the entire semantic network is maintained. For example, it is always possible to add another attribute to a resource class, but an attribute can only be removed if no instance of the class has a value for that attribute.<br/>
The relationships of both the existing and new revisions of the model element are associated with the latter, the now current revision.

After successful loading, the view changes to "Read" resp. "Edit".


{: .highlight }
_Note: If you load data from your local file system, it will be processed locally by your web browser. The SpecIF viewer or editor does not send any user data over the Internet and does not save any user data on a server. All user data remain local in your web browser._