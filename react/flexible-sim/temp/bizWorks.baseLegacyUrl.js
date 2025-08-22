var hostaddr = window.location.hostname;
var vertxhost = "http://" + hostaddr;
var hydiskhost = "http://edmdev2.skhynix.com";
var mailurl = "http://etsmaildev.skhynix.com";
var scheurl = "http://etsschedev.skhynix.com";
var apvurl = "http://apvdev2.skhynix.com";
var sendurl = "/MailA/Message/AddNewMessage.aspx";

if(hostaddr == "cube.skhynix.com") {
	vertxhost = "http://cube.skhynix.com";
	hydiskhost = "http://edms.skhynix.com";
	mailurl = "http://email.skhynix.com";
	scheurl = "http://schedule.skhynix.com";
	apvurl ="http://apv.skhynix.com";
	sendurl = "/WOW/MailA/Message/AddNewMessage.aspx";
}

var baseLegacyUrl = new Object();

baseLegacyUrl["Mail"] = {
	url: mailurl + "/WOW/Mail/Message/cubeMessageMaster.aspx",
	linktitle: "Skhynix CubeMail",
	width: "1200",
	height: "800",
	toolbar: "no",
	menubar: "no",
	scrollbars: "yes",
	resizable: "yes",
	method: "get",
	parameter: ""
};
