function injectEmail(elementId)
{
  // Email obfuscator script 2.1 by Tim Williams, University of Arizona
  // Random encryption key feature by Andrew Moulden, Site Engineering Ltd
  // This code is freeware provided these four comment lines remain intact
  // A wizard to generate this code is at http://www.jottings.com/obfuscator/

  coded = "9k21@nkGFGyWzG7.lk.DF"
  key = "awoj0SIxBgCMNAOhHe5vcyYknZJtQspTmr8RPuG63l74FzVE2X1fd9WUiqDLKb"
  shift=coded.length
  link=""
  for (i=0; i<coded.length; i++) {
    if (key.indexOf(coded.charAt(i))==-1) {
      ltr = coded.charAt(i)
      link += (ltr)
    }
    else {
      ltr = (key.indexOf(coded.charAt(i))-shift+key.length) % key.length
      link += (key.charAt(ltr))
    }
  }

  var emailElement = document.getElementById(elementId)
  emailElement.setAttribute("href", "mailto:" + link)
  emailElement.innerHTML = link
}
injectEmail('email-link-replace-element')
