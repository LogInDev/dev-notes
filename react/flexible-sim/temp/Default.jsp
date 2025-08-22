<%@page import="com.hynix.cube.framework.core.CubePlugIn"%>
<%@page import="com.hynix.cube.framework.account.vo.UserDetailVO"%>
<%@page import="com.hynix.cube.framework.account.vo.UserVO"%>
<%@page import="com.hynix.cube.framework.account.vo.UserNameLangVO"%>
<%@page import="com.hynix.cube.framework.config.CubeConfigHelper"%>
<%@page import="com.hynix.cube.framework.account.bo.UserBO"%>
<%@page import="com.hynix.cube.bizworks.bo.BizWorksDataBO"%>
<%@page import="com.hynix.cube.bizworks.vo.BizWorksCompanyLegacyURLVO"%>
<%@page import="com.hynix.cube.framework.channel.bo.DMChannelMemberBO"%>
<%@page import="com.hynix.cube.framework.authentication.bo.AuthenticatiorService" %>
<%@page import="java.util.ArrayList"%>
<%@page import="com.hynix.cube.framework.account.vo.UserPreferenceVO"%>
<%@page import="com.hynix.cube.framework.core.vo.LanguageEType"%>


<!DOCTYPE html> 
<html>
<head>
<meta charset="utf-8" />
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
<title>SK Hynix CUBE</title>
<script type='text/javascript' src='http://cube.skhynix.com/Resource/Script/jquery-1.12.3.min.js'></script>
<script type='text/javascript' src='http://cube.skhynix.com/Resource/Script/jquery-migrate-1.4.1.min.js'></script>
<script type='text/javascript' src='http://cube.skhynix.com/Resource/Script/jquery.ajax.js'></script>
<script type='text/javascript' src='http://cube.skhynix.com/Resource/Script/layerPopup.js'></script>

<script type='text/javascript' src='http://cube.skhynix.com/Resource/Script/common.js'></script>
<link href='http://cube.skhynix.com/Resource/Style/Skin1001/Lang1/Style.css' rel='stylesheet' type='text/css' />
<link href='http://cube.skhynix.com/Resource/Style/Skin1001/Lang1/error.css' rel='stylesheet' type='text/css' />
<link href='http://cube.skhynix.com/Resource/Style/jquery-ui/jquery-ui-1.8.21.custom.css' rel='stylesheet' type='text/css' />
<link href='http://cube.skhynix.com/Resource/Style/Skin1/Lang1/layerPopup.css' rel='stylesheet' type='text/css' />
<%!
	protected CubeConfigHelper getCubeConfigHelper() {
	CubePlugIn cubePlugIn = CubePlugIn.getInstance();
	return (CubeConfigHelper)cubePlugIn.getConfigHelper("CubeConfigHelper");
	}
 %>
 <%
 
	UserBO userBO = (UserBO) getCubeConfigHelper().getFactory().getBean("userBO");
	String company = "";
	if(AuthenticatiorService.getAuthenticatorService().getContext(request).getIdentity().getCompanyCode() != null) {
		company = AuthenticatiorService.getAuthenticatorService().getContext(request).getIdentity().getCompanyCode();
	} 
    BizWorksDataBO bizWorksDataBO = (BizWorksDataBO) getCubeConfigHelper().getFactory().getBean("bizWorksDataBO");
	DMChannelMemberBO dmChannelMemberBO = (DMChannelMemberBO)getCubeConfigHelper().getFactory().getBean("dmChannelMemberBO");
	int userID = AuthenticatiorService.getAuthenticatorService().getContext(request).getIdentity().getID();
	String companyCode = AuthenticatiorService.getAuthenticatorService().getContext(request).getIdentity().getCompanyCode();
	String uniqueName =AuthenticatiorService.getAuthenticatorService().getContext(request).getIdentity().getUniqueName();
	int channelID = Integer.parseInt(request.getParameter("channelID"));
	ArrayList<BizWorksCompanyLegacyURLVO> legacy =null;
	ArrayList<UserDetailVO> list =null;
	String members = "";
	if(Integer.toString(channelID).toString().substring(0,1).equals("2")){		
		list= userBO.selectUserListByChannelID(channelID);
	}else{
		list = dmChannelMemberBO.selectDMChannelMembersList(channelID);
	}
	
	UserPreferenceVO preSet = AuthenticatiorService.getAuthenticatorService().getContext(request).getPreference();
	LanguageEType languageType = preSet.getDefaultLanguageType();
	
	if(list.size() > 0){
		for(UserDetailVO mem : list){
			if(companyCode.equals(mem.getCompanyCode())){
				members += mem.getUniqueName().toString()+';';
			}else{
				members += mem.getEmail().toString()+";";
// 				members += mem.getNameLang().getNameLang(LanguageEType.toEnum(languageType.getLanguageType()))+" "+mem.getDeptName().getNameLang(LanguageEType.toEnum(languageType.getLanguageType()))+" <"+mem.getEmail().toString()+">;";
			}
		}	
	}
	legacy = bizWorksDataBO.selectListLegacyURLByUserID(userID);
	String url=null;
	String allUrl =null;
	String comUrl = null; 
	String tmpParam = null;
	String param = null;
	if(legacy.size() > 0){
		for(BizWorksCompanyLegacyURLVO urllist : legacy){
			if(urllist.getCompanyCode().equals("ALL") ){
				if(urllist.getLegacySystem().equals("MAIL") && urllist.getActionType().equals("EDIT")){
					allUrl = urllist.getUrl().toString();
					tmpParam = urllist.getParameter().toString();
				}
			}else if(urllist.getCompanyCode().equals(company)){
				if(urllist.getLegacySystem().equals("MAIL") && urllist.getActionType().equals("EDIT")){
					comUrl = urllist.getUrl().toString();
					tmpParam = urllist.getParameter().toString();
				}
			} 
		}
		if(comUrl != null){
			url =comUrl;
		}else url =allUrl;
		param =tmpParam;
	}
	
	String checkParam = "0";
	try{
		checkParam = request.getParameter("client").toString();
	}catch(Exception e){
		e.printStackTrace();
		checkParam = "0";
	}
	
	String language = "";
	
	switch(languageType.getLanguageType()){
	case 2:
		language = "ja";
		break;
	case 3:
		language = "en";
		break;
	case 4:
		language = "zh";
		break;
	default:
		language = "ko";
		break;
	}
	
	
%>
<script type='text/javascript'>
$(document).ready(function() {	
	urlCheck();
});
function urlCheck(){
	var exmailUrl = "";
	var mailUrl = "<%=url%>";
	var lang = "<%=language%>";
	if(mailUrl.indexOf("email.skhynix.com.cn") > -1){
		mailUrl = "http://email.skhynix.com.cn/WOW/Mail/Login/OAILoginProcess.aspx?callback=?";
        $.ajax({
            url : mailUrl,
            type : "POST",
            data : {
                id : "<%=uniqueName%>"
            },
            dataType : "jsonp",
            crossDomain : true,
            success : callbackForJsonp,
            error : function(XMLHttpRequest, status, err) {
                console.log(XMLHttpRequest.status + "\n" + err);
            }
        });
        mailUrl = "<%=url%>";
	}else if(mailUrl.indexOf("cubemail.skhynix-cq.com.cn") > -1){
		mailUrl = "http://cubemail.skhynix-cq.com.cn/WOW/Mail/Login/OAILoginProcess.aspx?callback=?";
        $.ajax({
            url : mailUrl,
            type : "POST",
            data : {
                id : "<%=uniqueName%>"
            },
            dataType : "jsonp",
            crossDomain : true,
            success : callbackForJsonp,
            error : function(XMLHttpRequest, status, err) {
                console.log(XMLHttpRequest.status + "\n" + err);
            }
        });
        mailUrl = "<%=url%>";
	}else if(mailUrl.indexOf("mail.us.skhynix.com") > -1){
		mailUrl = "http://mail.us.skhynix.com/WOW/Mail/Login/OAILoginProcess.aspx?callback=?";
        $.ajax({
            url : mailUrl,
            type : "POST",
            data : {
                id : "<%=uniqueName%>"
            },
            dataType : "jsonp",
            crossDomain : true,
            success : callbackForJsonp,
            error : function(XMLHttpRequest, status, err) {
                console.log(XMLHttpRequest.status + "\n" + err);
            }
        });
        mailUrl = "<%=url%>";
	}else if(mailUrl.indexOf("webmail.skhms.com") > -1){
		mailUrl = "http://webmail.skhms.com/WOW/Mail/Login/OAILoginProcess.aspx?callback=?";
		$.ajax({
            url : mailUrl,
            type : "POST",
            data : {
                id : "<%=uniqueName%>"
            },
            dataType : "jsonp",
            crossDomain : true,
            success : callbackForJsonp,
            error : function(XMLHttpRequest, status, err) {
                console.log(XMLHttpRequest.status + "\n" + err);
            }
        });
		mailUrl = "<%=url%>";
	}else if(mailUrl.indexOf("email.skhynix.com/WOW/Mail/") > -1){
		var param = "<%=param%>".replace(/{{LANGUAGENAME}}/gi, "<%=language%>");
		exmailUrl = mailUrl+"?"+param;
		<%
			if(checkParam.equals("1")){
				url = url.replace("http://", "https://");
		%>
		exmailUrl = exmailUrl.replace(/http:/g, 'https:');
		mailUrl = "https://email.skhynix.com/WOW/Mail/Login/OAILoginProcess.aspx?callback=?";
		<%
			}else{
		%>
		mailUrl = "https://email.skhynix.com/WOW/Mail/Login/OAILoginProcess.aspx?callback=?";
		<%
			}
		%>
		$.ajax({
            url : mailUrl,
            type : "POST",
            data : {
                id : "<%=uniqueName%>"
            },
            dataType : "jsonp",
            crossDomain : true,
            success : callbackForJsonp,
            error : function(XMLHttpRequest, status, err) {
                console.log(XMLHttpRequest.status + "\n" + err);
            }
        });
		mailUrl=exmailUrl;
	}else{
		mailUrl = "<%=url%>";
	}
	SendKnowledge(mailUrl);

}
function callbackForJsonp(json) {
	if (!json.Error) {
		//alert("TEST");
	}
}
function SendKnowledge(url) {
	mailForm = document.createElement('form');
	mailForm.setAttribute('id', 'mailForm')
	mailForm.setAttribute('method', 'POST');
	mailForm.setAttribute('action', url);

	document.body.appendChild(mailForm);
	var inputTitle = document.createElement('input');
	inputTitle.setAttribute('type', 'hidden');
	inputTitle.setAttribute('name', 'hdSubject');
	inputTitle.setAttribute('id', 'hdSubject');
	
	//Mail Title
	inputTitle.setAttribute('value', '');
	mailForm.appendChild(inputTitle);
	var inputTo = document.createElement('input');
	inputTo.setAttribute('type', 'hidden');
	inputTo.setAttribute('name', 'to');
	inputTo.setAttribute('id', 'to');
	inputTo.setAttribute('value','<%=members%>');
	
	mailForm.appendChild(inputTo);
	var inputContent = document.createElement('input');
	inputContent.setAttribute('type', 'hidden');
	inputContent.setAttribute('name', 'hdBody');
	inputContent.setAttribute('id', 'hdBody');
	
	//Mail Content
	inputContent.setAttribute('value', '');
	mailForm.appendChild(inputContent);
	mailForm.target = '_self';
	self.resizeTo(860, 650);
	mailForm.submit()
}
</script>
</head>
<body>
</body>
</html>
