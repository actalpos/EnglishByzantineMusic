This application is to facilitate the aggregation of hymns in religious service and make the service accessible on the web or mobile Devices

The process
=============

The service files used are found on the Antiochian Archdiocese site in RTF format having bylingual content arranged on 2 table columns, English and Arabic.
The RTF files are transformed into docx files with Microsoft word and then into html with Libre Office.
The html files get added manually links to a js script and a titles json file references.
The script helps formatting the html content at the runtime, while getting displayed on the screen and also to add the links to the document titles. 
The document titles are keys for the title json file to retrieve the physical location of the file it wants to open.

The service text content mark the required hymns with a title, usually bolded with upper case characters, but not always. Ex "OR LORD" I HAVE CRIED. 
The titles can have different extra characters in them as in the above example. Currently we do exact match on the hymn title content. 

The html files are placed onto a web application so the chanters would be able to select a date and a service for display to open the html file.

To help the chanters find the required hymns quickly, the ask is to make the hymn titles as link to the hymn sitting in the Google drive hymn repository.
Also the link should open a new tab.

The following process takes place for each service to address the requirement:
1. Download the rtf bilingual service file from the Antiochian Archdiocese site
2. Open it with Microsoft word and save it as docx file
3. Open the docx file with LibreOffice and save it as html file. The html is preferred because the link can be controlled to open in a new tab.
4. Edit the html file and add the following 3 lines to correct the previous steps conversion issues, to make the html responsive and to add the hymn title links
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="stylesheet" href="/byzmusic/system/styles/layout-fixes.css">
	<script src="/byzmusic/system/scripts/layout-fixes-and-links.js" defer></script>	

Monolanguages:
<meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/byzmusic/system/styles/common.css">
<link rel="stylesheet" href="/byzmusic/system/styles/bilingual.css">
<link rel="stylesheet" href="/byzmusic/system/styles/monolingual.css">

<script src="/byzmusic/system/scripts/layout-fixes.js" defer></script>
<script src="/byzmusic/system/scripts/title-links.js" defer></script>	

5. Add the html to the Service_Texts folder in the required fixDate/variableDate and month/date folder (see the folder structe below)
6. Run the update-liturgical-service-file-list.js script to add the new html service file to the liturgical-service-file-list.json
7. Run the local python server if not running already
8. The file should be already picked up by the index.html. Check the file format and the links. If there is link missing add the hymn title to the hymn pdf description field in the Google drive repository.
9. Run update-title-link.js to update the titleLink.json file.
10. If all ok publish to github repo.

We try to avoid any manual content customization on the html page.


TODO: A new challenge is that a hymn could have more than one versions. In this case the ask is to have the title hymn display normal, but have the multiple versions displayed as links so that the chanter can 
select any of the versions. 
Example: title: "O LORD" I HAVE CRIED
has 2 versions: Slow and Brief and the result should be: "O LORD" I HAVE CRIED (Slow) (Brief) with (Slow) (Brief) as hyperlinks
Or a hymn could have 2 different authors. The ask is to shouw the differences ex title: Apolitikion Resurrection (SA) (AA)
(SA) (AA) to be shouwn as hyperlinks selectable individually.
THIS IS RESOLVED



The has 2 parts: 
- web application responsible for accessing services
- hymn repository responsible for providing hymns in pdf format

A. The web application:
========================

Has the following structure:

Index.html - responsible for displaying the religious services by year/month/day in the form of times on web or mobile device (responsive)
the content is Fed from /system/data/liturgical-service-file-list.json file

|--assets                                             <---- folder responsible for holding the required web libraries, images, etc.

|--system                                             <---- folder responsible for organizing the site data and maintenance scripts
   |-- data
          |-- liturgical-service-file-list.json       <---- file holding the current summary of the /fixDate and /variableDate html file names/path/display name, used by index.html to show the list
          |-- titleLink.json                          <---- file to hold the file google drive link and the Description. The Description is the HTML text that will be converted to hyperlink in realtime when opening the Html
          |-- divine_liturgy.json                     <---- file holding the Divine_Liturgy.html content
   |-- scripts
          |-- generate_divine_liturgy_html.js         <---- generate /template/divine_Liturgy.html from divine_liturgy.json
          |-- update-liturgical-service-file-list.js  <---- script to refresh the liturgical-service-file-list.json after adding html files
	  |-- update-title-link.js                    <---- script to run the google script scan https://script.google.com/u/1/home/projects/10SMApOvsRJ-7K5knca8Q-hl1rIPpWyTP1pC772_wuh9nqmG2rw6weJ7g/edit 
                                                            to scan the file descriptions and to update the system/data/titleLink.json file
          |-- validate_service_texts_summary.js.      <---- script to vlidate after the above was run
          |-- copy_template.sh                        <---- copies /template/divine_Liturgy.html into the following low level folders:
          |-- layout-fixes-and-links.js               <---- realtime script to fix any issues during rtf to html conversion and to feed the related links from the titleLink json file

|--Service_Texts                                      <---- folder responsible with dates and the service files

    |--fixed  <-Folder for the fix-date feasts:
      |--01
        |-06
          Divine_Liturgy_Variables.html               <---- html files with the liturgical service content
          Vespers.html
          Orthros.html               
        |-07
        |-30
      |--02
      |--03
      ....
      |--12

    
    |--variable.  <-Folders for the variable date feasts
      |--2026
        |--01
          |--04
          |--11
            Divine_Liturgy.html
            Divine_Liturgy_Variables.html
            Vespers.html
            Orthros.html
          |--18
          |--25
      |--2026
        |--02
      .....
      |--2026
        |--12

  |--template
    Divine_Liturgy.html

|-- styles
    layout-fixes.css                                <--- responsible to fix any css issue resulted in the rtf to html conversion    


1 Technical details:
Currently running on GitHub pages. It can be found on GitHub at the publicly accessible actalpos/byzmusic project.
It is compiled and tested locally and pushed to Gitbub via normal procedure

2 Content:
Services can be on a fixed date of the year or on a variable date, which repeats after 6 years.
The html files

  System folder
  -------------
  folder responsible for organizing the site data and maintenance scripts
  data:
  - liturgical-service-file-list.json file holding the current summary of the /fixDate and /variableDate html file names/path/display name, used by index.html to show the list, example:
    {
      {
        "date": "2026-02-22",
        "title": "Feb 22 2026 Bilingual ORTHROS",
        "order": -1,
        "file": "Service_Texts/variableDate/2026/02/22/Feb 22 2026 Bilingual ORTHROS.html"
      },
      {
        "date": "2026-02-22",
        "title": "Feb 22 2026 Bilingual VESP",
        "order": -1,
        "file": "Service_Texts/variableDate/2026/02/22/Feb 22 2026 Bilingual VESP.html"
      },
    ....
    }

    it gets generated by running the node script update-liturgical-service-file-list.js

  - titleLink.json (should be renamed to hymnTitleLink) file to hold the google drive file link that has the Description set to the hymn title. 
  The Description is the HTML text that will be converted to hyperlink in realtime when opening the Html by the layout-fixes-and-links.js script
  example:
  {
        "RESURRECTIONAL APOLYTIKION IN TONE SIX": {
      "url": "https://drive.google.com/file/d/1lFQbTX-qhwPlWcoPQPWD_jtnD409hpfr/view?usp=drivesdk",
      "name": "ApolitikionResurrection-pl2nd.pdf",
      "description": "RESURRECTIONAL APOLYTIKION\nIN TONE SIX",
      "path": "Bilingual Services / Vespers / 9 Resurrection Apolitikion"
    },
    "RESURRECTIONAL APOLYTIKION IN TONE THREE": {
      "url": "https://drive.google.com/file/d/1d-vAeWe8ZyuU2RkW6SX65k-Aq2v7Lgdw/view?usp=drivesdk",
      "name": "ApolitikionResurrection-3rd.pdf",
      "description": "RESURRECTIONAL APOLYTIKION\nIN TONE THREE",
      "path": "Bilingual Services / Vespers / 9 Resurrection Apolitikion"
    },
    ...
  }

  scripts:
  - layout-fixes-and-links.js realtime script to fix any html issues generated during rtf to html conversion and to feed the related links from the titleLink json file, and to make the html responsive
  the reference to this scripts gets added manually during the rtf to html conversion process
  - update-liturgical-service-file-list.js script to refresh the liturgical-service-file-list.json after manually adding html files into the Service_Texts folder structure
  - update-title-link.json script to trigger the google script scan https://script.google.com/u/1/home/projects/10SMApOvsRJ-7K5knca8Q-hl1rIPpWyTP1pC772_wuh9nqmG2rw6weJ7g/edit to scan the file descriptions 
  and to update the system/data/titleLink.json file


Tools created:
Pdftxt2img.sh # transforms the PDF's from the current folder into image type pdf's

The front end index.html will ask the userr to select a month
The app renders the Html file names found in the liturgical-service-file-list.json  for the selected month from
both the fix-date and for the variable date folders and index.html file render them chronologically at load time.

liturgical-service-file-list.json file format:
[
  {
    "date": "2026-01-06",
    "type": "fix",
    "title": "Divine Liturgy",
    "file": "Service_Texts/fixDate/01/06/Divine_Liturgy.html"
  },
  {
    "date": "2026-01-06",
    "type": "fix",
    "title": "Vespers",
    "file": "Service_Texts/fixDate/01/06/Vespers.html"
  },
  {
    "date": "2026-01-11",
    "type": "variable",
    "title": "Divine Liturgy",
    "file": "Service_Texts/variableDate/2026/01/11/Divine_Liturgy.html"
  }
]

titleLink.json file format:
{
  "GREAT DOXOLOGY IN TONE ONE": {
    "url": "https://drive.google.com/file/d/1iNzEXnQHpdRtQQF3N_7rWXatJpYvKxQU/view?usp=drivesdk",
    "name": "BriefDoxology-1st-SA-EN.pdf",
    "description": "GREAT DOXOLOGY IN TONE ONE",
    "path": "EnglishByzantineMusic / Orthros / 16 Doxology"
  },
  "Holy is the Lord our God. (thrice)": {
    "url": "https://drive.google.com/file/d/1F_ffDckQzXcvA6rYIIxH_3JbooqgVDUH/view?usp=drivesdk",
    "name": "HolyIsTheLordOurGod-2nd-EN-AR.pdf",
    "description": "Holy is the Lord our God. (thrice)",
    "path": "EnglishByzantineMusic / Orthros / 11 Holy Is The Lord Our God"
  },
}

maintenance
------------

- for the imported PDF's from SA and AA apply this script:
gs -sDEVICE=pdfimage24 -dSAFER -dBATCH -dNOPAUSE    -r300    -sOutputFile=out.pdf in.pdf
To avoid mobile device auto selection on touchscreen

- For the Divine Liturgy
- save it as html with the following naming convention: 
  If it is for the Divine Liturgy call it Divine_Liturgy_Variables.html

- save and check the links, the format and the responsiveness
- from Service_Texts/system/scripts run at the command line to update the service_texts_summary.json file:
  node Service_Texts/system/update_service_texts_summary.js
  node Service_Texts/system/validate_service_texts_summary.js

3. If one or more templates are required run from the command line:
  ./copy_template.sh

4. If one or more templates are updated run:
  ./copy_template.sh to update the template in all folders.  



nu e bine. Pentru split pe pagini Scriptul trebuie sa se uite in english, arabic si greek folders pt GreatDoxology-1st folder daca exista, sa combine pdf's din cele 3 folders daca exista in toate 3. Incepe cu English care decide. Rezultatul va fi in bilingual folderul curent GreatDoxology-1st.pdf. Simplu. Deci va crea/suprescrie doar cand va vedea acest folder cu split.Va combina doar cand una din celelalte arabic sau greek vor avea split.  
   