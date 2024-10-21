---
title: "Complex Data-Types"
layout: default
parent: "Tutorials"
nav_order: 10
---

# Tutorial 10: Complex Data-Types

Next, we will introduce complex data-types available since SpecIF v1.2.

```
{
  "dataTypes": [{
    "id": "DT-Coordinate",
    "title": "A coordinate as a real number.",
    "type": "xs:double",
    "revision": "1.2",
    "changedAt": "2024-11-21T10:08:31.960Z"
  },{
    "id": "DT-GeoPoint",
    "title": "geo:Point",
    "type": "xs:complexType",
    "description": [{
      "text": "A point in space, specified by three coordinates.",
      "language": "en"
    },{
      "text": "Ein Punkt im Raum, spezifiziert durch drei Koordinaten.",
      "language": "de"
    }],
    "sequence": [{
      "dataType: { "id": "DT-Coordinate" },
      "title": "X"
    },{
      "dataType: { "id": "DT-Coordinate" },
      "title": "Y"
    },{
      "dataType: { "id": "DT-Coordinate" },
      "title": "Z"
    }],
    "multiple": false,
    "revision": "1.2",
    "changedAt": "2024-11-21T10:08:31.960Z"
  }]
}
```

... and the referencing propertyType:
```
{
  "propertyClasses": [{
    "id": "PC-GeoPoint",
    "title": "geo:Point",
    "description": [{
        "text": "A point in space, specified by three coordinates.",
        "language": "en"
    },{
        "text": "Ein Punkt im Raum, spezifiziert durch drei Koordinaten.",
        "language": "de"
    }],
    "dataType: { "id": "DT-GeoPoint" },
    "multiple": false,
    "revision": "1.2",
    "changedAt": "2024-11-21T10:08:31.960Z"
  }]
}
```

A resource's or statement's property value is given as follows:
```
{
  "resources": [{
    "id": "Req-5ba3512b0000bca",
    "title": "Minimum button size",
    "class": "RC-Requirement",
    "properties": [{
      "dataType": "PC-GeoPoint",
      "values": [[ "1.2",  "2.3", "4.0" ]]
    }]
    "changedAt": "2024-11-21T10:08:31.960Z"
  }]
}

```

As always, _properties_ is a list of properties, which in turn is a list of one or more values.
The complex value is a list with SpecIF values corresponding to the dataType. 
The example shows simple real numbers, but it could be pointers to enumerated values or multi-language texts.
Complex data-types may be nested, but without cyclic dependencies: A complex data-type must be a tree.

<!--
You may view the example using the <a href="https://specif.de/apps/view.html#import=https://specif.de/examples/v1.1/01_Hello-World.specif" target="_blank">SpecIF Viewer</a>, or download the SpecIF data:
- v1.0: [Hello World](https://specif.de/examples/v1.0/01_Hello-World.specif)
- v1.1: [Hello World](https://specif.de/examples/v1.1/01_Hello-World.specif)
- v1.2: [Hello World](https://specif.de/examples/v1.2/01_Hello-World.specif)
-->