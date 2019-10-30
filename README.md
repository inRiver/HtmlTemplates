# HtmlTemplates

This repository should contain usefull HtmlTemplates. By usefull means that it should be in such nature that one can learn something from them.

# Specification Mass Update 
specification_mass_update.html

This HtmlTemplate is written as part of a costomer demanded feature. It is used as an Application Template and utilizes the rest api and some basic JavaScript/jQuery based generation of Html. On top of that the following features are worth pointing out:

- As parts of the rest api has a fetch limit set to maximum a thousand entities there is some code that chunks up larger amount of entities into chunks of a thousand each. See the forEachParallel(...) function.
- Throtling of calls towards iPMC. As there is a upper limit of how many calls that can be handled simultanously there is a mechnism that does not do more than 10 calls at a time. 

# Category And Status 
CatalogAndStatus_EditTemplate.html and CatalogAndStatus_EditTemplate_Razor.html

This template is an edit tempalate. There are two versions. One is based on JavaScript and the other is Based on Razor). They uses the functionality of the edit template where the structure of the entity is provided as a json structure with complete set of data and fields. It also contains code for showing the pen in order to use the built in field editor controls.
