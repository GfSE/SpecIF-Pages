---
title: "Complex Data-Types"
layout: default
parent: "Tutorials"
nav_order: 10
---

# Tutorial 10: Complex Data-Types

Next, we will introduce complex data-types available since SpecIF v1.2.

A complex data-type consists of a _sequence_ of simple or complex data-types. A sequence is a list where the position of elements matters.
Thus, complex data-types can be nested, but any cyclic dependency is prohibited: In other words, the resulting data-type may have multiple layers and must be a _tree_.
In addition, a value assigned to a property with complex data-type must have a list of values corresponding to the sequence of its data-type.

Have a look at the following example:
- The sequence contains three elements with a title and a pointer to a dataType.

```json
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
      "text": "A point in space, specified by three cartesian coordinates.",
      "language": "en"
    },{
      "text": "Ein Punkt im Raum, spezifiziert durch drei kartesische Koordinaten.",
      "language": "de"
    }],
    "revision": "1.2",
    "changedAt": "2024-11-21T10:08:31.960Z"
  }]
}
```

The referencing propertyClass and resourceClass is similar to others discussed in the previous tutorials:
```json
{
  "propertyClasses": [{
    "id": "PC-Coordinate-X",
    "title": "X",
    "description": [{
      "text": "Coordinate X.",
      "language": "en"
    },{
      "text": "Koordinate X.",
      "language": "de"
    }],
    "dataType": { "id": "DT-Coordinate" },
    "required": "true",
    "multiple": false,
    "revision": "1.2",
    "changedAt": "2025-02-06T10:08:31.960Z"
  },{
    "id": "PC-Coordinate-Y",
    "title": "Y",
    "description": [{
      "text": "Coordinate Y.",
      "language": "en"
    },{
      "text": "Koordinate Y.",
      "language": "de"
    }],
    "dataType": { "id": "DT-Coordinate" },
    "required": "true",
    "multiple": false,
    "revision": "1.2",
    "changedAt": "2025-02-06T10:08:31.960Z"
  },{
    "id": "PC-Coordinate-Z",
    "title": "Z",
    "description": [{
      "text": "Coordinate Z.",
      "language": "en"
    },{
      "text": "Koordinate Z.",
      "language": "de"
    }],
    "dataType": { "id": "DT-Coordinate" },
    "required": "true",
    "multiple": false,
    "revision": "1.2",
    "changedAt": "2025-02-06T10:08:31.960Z"
  },{
    "id": "PC-GeoPoint",
    "title": "geo:Point",
    "description": [
      {
        "text": "A point in space, specified by three cartesian coordinates.",
        "language": "en"
      },{
        "text": "Ein Punkt im Raum, spezifiziert durch drei kartesische Koordinaten.",
        "language": "de"
      }
    ],
    "dataType": { "id": "DT-GeoPoint" },
    "sequence": [
      {
        "id": "PC-Coordinate-X"
      },{
        "id": "PC-Coordinate-Y"
      },{
        "id": "PC-Coordinate-Z"
      }
    ],
    "multiple": false,
    "revision": "1.2",
    "changedAt": "2025-02-06T10:08:31.960Z"
  }],
  "resourceClasses": [{
    "id": "RC-94e50d5023b1a80157",
    "title": "geo:Point",
    "propertyClasses": [
      {
        "id": "PC-Name"
      },{
        "id": "PC-GeoPoint"
      }
    ],
    "changedAt": "2024-11-21T10:08:31.960Z"
  }],
}
```

A resource's or statement's property value is given as follows:
- An element in the values list is a list with values corresponding to the dataType's sequence; 
thus a property can have multiple values (provided that 'multiple' is set to 'true' in the propertyClass), where each value is a list with values according to its complexType.
- The position within the list determines by which element in the dataType's sequence it is defined.
- Here, the elements of the value list are simple data-types, more concretely real numbers. 
In general, values of any SpecIF dataType are allowed, e.g. multi-language texts, pointers to enumerated values of the dataType or the values of a nested complex data-type. 

```json
{
  "resources": [{
    "id": "R-d5b902394e50",
    "class": "RC-94e50d5023b1a80157",
    "properties": [{
      "class": { "id": "PC-Name" },
      "values": [
        [{ "text": "A point in space" }]
      ]
    },{
      "class": {"id": "PC-GeoPoint"},
      "values": [
        [{
          "class": { "id": "PC-Coordinate-X" },
          "values": [ "1.2" ]
        },{
          "class": { "id": "PC-Coordinate-Y" },
          "values": [ "2.3" ]
        },{
          "class": { "id": "PC-Coordinate-Z" },
          "values": [ "4.0" ]
        }]
      ]
    }],
    "changedAt": "2024-11-21T10:08:31.960Z"
  }]
}
```

Recap: As always, _properties_ is a list of one or more values, if the corresponding propertyClass allows it.
The complex value is a list with SpecIF values corresponding to their respective dataType. 
The example shows simple real numbers, but it could be pointers to enumerated values or multi-language texts.
Complex dataTypes may be nested, but without cyclic dependencies: A complex dataType must be a tree.

You may 
- view the example using the <a href="https://specif.de/v1.2/apps/view.html#import=https://specif.de/examples/v1.2/10_Complex-DataType.specif" target="_blank">SpecIF Viewer</a>, or
- download the SpecIF data: <a href="https://specif.de/examples/v1.2/10_Complex-DataType.specif">v1.2</a>.

<!-- The SpecIF Editor and Viewer supporting v1.2 with complex data types is still in development. -->
