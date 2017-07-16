
var managemoduleController = angular.module('managemoduleController', ['OWARoutes']);

managemoduleController.service('ModuleService',['$http', 'OWARoutesUtil','$q', function ($http, OWARoutesUtil,$q) {
    
    return{
        uploadModules : function(moduleUrl){
                 ////////////////////////////////
                var def = $q.defer();
            
                  var fd = new FormData();
                  $http.get(moduleUrl, {responseType: "arraybuffer"})
                  .success(function (data){ // GET REQUEST ERROR HANDLE
                        var filename = moduleUrl.substring(moduleUrl.lastIndexOf('/')+1);
                        let blob = new Blob([data], {type: 'application/octet-stream'});  
                        var url=(window.URL).createObjectURL(blob);
                        var file = new File([data], filename, {type:"application/octet-stream", lastModified: new Date().getTime()});
                        fd.append('file', file);
                      
                    console.log("POST started...");
                      
                    var uploadUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/module/?"; //CHANGE
                    isUploading=true;

                 $http.post(uploadUrl, fd, {
                   transformRequest: angular.identity,
                   headers: { 
                    'Content-Type': undefined ,  
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'}
                  }) .success(function (data, status, headers, config) {  // POST REQUEST ERROR HANDLE
                     def.resolve(["UPLOAD",1,data,status]);
                 })
                      .error(function (data, status, header, config) { // POST REQUEST ERROR HANDLE
                        def.resolve(["UPLOAD",0,data,status]);
                 });
                }).error(function (data,status){ // GET REQUEST ERROR HANDLE
                      def.resolve(["DOWNLOAD",0,data,status]);
                });
                 return def.promise;
                ////////////////////////////////
        },
        getModuleDetails : function(moduleUuid){
            var def = $q.defer();
            var requestUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/module/"+moduleUuid;
            $http.get(requestUrl, {params:{ v : 'full'}})
            .success(function (data, status){ // GET REQUEST SUCCESS HANDLE
                def.resolve(["GET",1,data,status]);
            }).error(function (data,status){ // GET REQUEST ERROR HANDLE
                def.resolve(["GET",0,data,status]);
            });
            return def.promise;
        },
        
        getModuleDetailsFromOnline : function(moduleLegacyId){
            var def = $q.defer();
            var requestUrl = "https://modules.openmrs.org/modulus/api/search?q="+moduleLegacyId;
            $http.get(requestUrl, {params:{ v : 'full'}})
            .success(function (data, status){ // GET REQUEST SUCCESS HANDLE
                def.resolve(["GET",1,data,status]);
            }).error(function (data,status){ // GET REQUEST ERROR HANDLE
                def.resolve(["GET",0,data,status]);
            });
            return def.promise;
        },
        
        getAllModuleDetails : function(){
            var def = $q.defer();
            var requestUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/module";
            $http.get(requestUrl, {params:{ v : 'full'}})
            .success(function (data,status){ // GET REQUEST SUCCESS HANDLE
                 def.resolve(["GET",1,data,status]);
            }).error(function (data,status){ // GET REQUEST ERROR HANDLE
                 def.resolve(["DOWNLOAD",0,data,status]);
            });
            return def.promise;
        },
        
        checkModuleUpdate : function(moduleUuid){
           var def = $q.defer();
           var searchValue = moduleUuid;
           var column_count=1;
           var columns="CVersion";
           var displayStart=0;
           var displayLength=15;

           var urll="https://modules.openmrs.org/modulus/modules/findModules?callback=JSON_CALLBACK&sEcho=13&iColumns="+column_count+"&sColumns="+columns+"&iDisplayStart="+displayStart+"&iDisplayLength="+displayLength+"&bEscapeRegex=true&sSearch="+searchValue;
       
           $http({
             method: 'JSONP', 
             url: urll
           })
           .success(function(data,status) {
                def.resolve(["GET",1,data,status]);
                  })
           .error(function(data, status) {
                def.resolve(["GET",0,data,status]);
           });
           return def.promise;
        }
        
    };
}]);


managemoduleController.controller('ModuleListCtrl', 
		['$scope', '$location', '$route', '$routeParams', 'OWARoutesUtil', '$http' , '$rootScope', 'ModuleService',
        function($scope, $location, $route, $routeParams, OWARoutesUtil, $http , $rootScope, ModuleService) {
    
    
      // *** /OpenMRS breadcrumbs ***  
      $rootScope.$emit("updateBreadCrumb", {breadcrumbs : [["SysAdmin","#"],["Modules",""]]});
      // *** /OpenMRS breadcrumbs ***

            
            
    $scope.updateModule= function(moduleUrl){
        console.log("update Module");
        // Remove the notification about Update
        if(typeof($scope.moduleUpdateURL)!=undefined){
            delete $scope.moduleUpdateURL;
        }
       $scope.moduleNewUpdateFound="0"; // working or disabled
        
        $scope.isDownloading=true;
        var response = ModuleService.uploadModules(moduleUrl);
        response.then(function(result){
            console.log(result);
            
            responseType=result[0]; //UPLOAD or DOWNLOAD
            responseValue=result[1]; // 1- success | 0 - fail
            responseData=result[2];
            responseStatus=result[3];
            
            if(responseType=="UPLOAD"){
                $scope.isDownloading=false;
                $scope.downloadSuccessMsg="Module Download Completed";
                if(responseValue==1){
                        console.log("Upload Success");
                       $scope.isUploading=false;
                       var x2js = new X2JS();
                       var JsonSuccessResponse = x2js.xml_str2json(responseData);
                            var moduleName = JsonSuccessResponse["org.openmrs.module.Module"].name;
                            uplodedsuccessMsg=moduleName+" has been loaded"
                            responseJsonData=JsonSuccessResponse;
                            if (typeof(JsonSuccessResponse["org.openmrs.module.Module"].startupErrorMessage) == "undefined")
                                {
                                    // Started Successfully
                                    $scope.startupsuccessMsg=moduleName+" has been loaded and started Successfully"
                                    $scope.checkAllModulesForUpdate();
                                }
                            else{
                                    //start up Error Found 
                                    $scope.startuperrorMsg="Could not start "+moduleName+" Module."
                            }
                }
                else{
                    console.log("Upload Success");
                       $scope.isUploading=false;
                       var x2js = new X2JS();
                       var JsonErrorResponse = x2js.xml_str2json(responseData);
                            console.log(JsonErrorResponse);
                            console.dir(JsonErrorResponse);
                            if (typeof(JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined"){
                                // File Error Catched
                                if (typeof(JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined"){
                                    // Error Message given
                                    $scope.uploadederrorMsg=JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                                }
                                else{
                                    // Unknown Error Message
                                    $scope.uploadederrorMsg="Error loading module, no config.xml file found"
                                }
                            }
                            else{
                                //unknown Error
                                $scope.uploadederrorMsg="Error loading module!"
                            }
                }
            }
            else{
                console.log("Download Error" );
                 $scope.isDownloading=false;
                 $scope.downloadErrorMsg="Could not download the Module";
            }
            //console.log(result);
        });
    }
    
	$scope.go = function ( path ) {
		$location.path( path );
	};

	$scope.redirect = function(){
  		window.location = "#/page.html";
	}
	
	//holds objects of selected checkboxes
	$scope.selected = {};

        
    $scope.StartModule = function(moduleUuid,resource){
      	console.log("start module");
        $scope.isStartModule=true;
      	if(typeof($scope.startModuleSuccess)!=undefined){
            delete $scope.startModuleSuccess;
        }
      	 if(typeof($scope.startModuleError)!=undefined){
            delete $scope.startModuleError;
        }

      	var uploadUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/moduleaction";
      	var moduleData = 
                     {
                         "action": "start",
                         "modules": [moduleUuid]
                     };

      	$http.post(uploadUrl, moduleData ,  {
            headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'}
        }) .success(function (data, status, headers, config) {
             $scope.isStartModule=false;
            if(resource=="ALLMODULES"){
                $scope.getAllModuleDetails();
            }
            else {
                $scope.getModuleViewDetails();
            }
        	$scope.startModuleSuccess="Module Started successfully.";
        })
        .error(function (data, status, headers, config) {
        		//console.log(status);
        		//console.log(config);
        		//console.log(headers);
        		 $scope.isStartModule=false;
        		var x2js = new X2JS();
                var JsonSuccessResponse = x2js.xml_str2json(data);

                if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined"){
                    // File Error Catched
                    if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined"){
                        // Error Message given
                        $scope.startModuleError=JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                    }
                    else{
                        // Unknown Error Message
                        $scope.startModuleError="Could not Start this Module!"
                    }
                }
                else{
                    //unknown Error
                    $scope.startModuleError="Could not Start this Module!"
                }
        });
      }
	
      $scope.StopModule = function(moduleUuid,resource){
      	console.log("Stop module");
         $scope.isStopModule=true;
      	if(typeof($scope.stopModuleSuccess)!=undefined){
            delete $scope.stopModuleSuccess;
        }
        if(typeof($scope.stopModuleError)!=undefined){
            delete $scope.stopModuleError;
        }

      	var uploadUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/moduleaction";
      	var moduleData = 
                     {
                         "action": "stop",
                         "modules": [moduleUuid]
                     };

      	$http.post(uploadUrl, moduleData ,  {
            headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'}
        }) .success(function (data, status, headers, config) {
            $scope.isStopModule=false;
            if(resource=="ALLMODULES"){
                $scope.getAllModuleDetails();
            }
            else {
                $scope.getModuleViewDetails();
            }
        	$scope.stopModuleSuccess="Module Stoped successfully.";
        })
        .error(function (data, status, headers, config) {
                $scope.isStopModule=false;
        		var x2js = new X2JS();
                var JsonSuccessResponse = x2js.xml_str2json(data);

                if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined"){
                    // File Error Catched
                    if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined"){
                        // Error Message given
                        $scope.stopModuleError=JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                    }
                    else{
                        // Unknown Error Message
                        $scope.stopModuleError="Could not Stop this Module!"
                    }
                }
                else{
                    //unknown Error
                    $scope.stopModuleError="Could not Stop this Module!"
                }
        });
      }
//      
//      function getModuleNameUsingPackageName(packageName){
//            var moduleUuid=packageName.toString().replace("org.openmrs.module.","");
//          console.log(moduleUuid);
//            var response = ModuleService.getModuleDetails(moduleUuid);
//            response.then(function(result){            
//                if(result[0]=="GET"){
//                    if(result[1]==1){
//                        console.log(result[2]);
//                        return result[2].display;
//                    }
//                }
//                return moduleUuid;
//            });
//      }
    
      $scope.unloadConfirmationShow = function(moduleUuid){
      	if(typeof($scope.uploadConfirmModuleData)!=undefined){
            delete $scope.uploadConfirmModuleData;
        }
        
        var response = ModuleService.getModuleDetails(moduleUuid);
        response.then(function(result){            
            if(result[0]=="GET"){
                if(result[1]==1){
                    //$scope.uploadConfirmModuleData=result[2];
                    var moduleDisplayNames=[];
                    angular.forEach(result[2].requiredModules, function(value, key) {
                        var moduleName=value.toString().replace("org.openmrs.module.","");
                        var responseModule = ModuleService.getModuleDetails(moduleName);
                        responseModule.then(function(resultModule){            
                            if(resultModule[0]=="GET"){
                                if(resultModule[1]==1){
                                    //console.log(resultModule[2]);
                                    //return resultModule[2].display;
                                    moduleDisplayNames.push(resultModule[2].display);
                                }else{
                                    moduleDisplayNames.push(moduleName);
                                }
                            }else{
                                moduleDisplayNames.push(moduleName);
                            }
                        });
                    });
                    $scope.uploadConfirmModuleData={
                        "uuid" : moduleUuid,
                        "requiredModules" : moduleDisplayNames
                    }
                   // console.log($scope.uploadConfirmModuleData);
                }
            }
        });
        angular.element('#deleteConfirmation').modal('show');
      }
      
      
      
//      $scope.unloadConfirmationShow = function(moduleUuid){
//      	if(typeof($scope.uploadConfirmModuleData)!=undefined){
//            delete $scope.uploadConfirmModuleData;
//        }
//        var response = ModuleService.getModuleDetails(moduleUuid);
//        response.then(function(result){            
//            if(result[0]=="GET"){
//                if(result[1]==1){
//                    //$scope.uploadConfirmModuleData=result[2];
//                    var moduleDisplayNames=[];
//                    angular.forEach(result[2].awareOfModules, function(value, key) {
//                        console.log(value," : ",key);
//                        console.log(getModuleNameUsingPackageName(value));
//                      moduleDisplayNames.push(getModuleNameUsingPackageName(value));
//                    });
//                    $scope.uploadConfirmModuleData={
//                        "uuid" : moduleUuid,
//                        "awareOfModules" : moduleDisplayNames
//                    }
//                    console.log($scope.uploadConfirmModuleData);
//                }
//            }
//        });
//        angular.element('#deleteConfirmation').modal('show');
//      }
      

        $scope.stopConfirmationShow = function(moduleUuid){
      	if(typeof($scope.stopConfirmModuleData)!=undefined){
            delete $scope.stopConfirmModuleData;
        }
        
        var response = ModuleService.getModuleDetails(moduleUuid);
        response.then(function(result){            
            if(result[0]=="GET"){
                if(result[1]==1){
                    //$scope.uploadConfirmModuleData=result[2];
                    var moduleDisplayNames=[];
                    angular.forEach(result[2].requiredModules, function(value, key) {
                        var moduleName=value.toString().replace("org.openmrs.module.","");
                        var responseModule = ModuleService.getModuleDetails(moduleName);
                        responseModule.then(function(resultModule){            
                            if(resultModule[0]=="GET"){
                                if(resultModule[1]==1){
                                    //console.log(resultModule[2]);
                                    //return resultModule[2].display;
                                    moduleDisplayNames.push(resultModule[2].display);
                                }else{
                                    moduleDisplayNames.push(moduleName);
                                }
                            }else{
                                moduleDisplayNames.push(moduleName);
                            }
                        });
                    });
                    $scope.stopConfirmModuleData={
                        "uuid" : moduleUuid,
                        "requiredModules" : moduleDisplayNames
                    }
                    //console.log($scope.stopConfirmModuleData);
                }
            }
        });
        angular.element('#stopConfirmation').modal('show');
      }
            
//      $scope.stopConfirmationShow = function(moduleUuid){
//      	if(typeof($scope.stopConfirmModuleData)!=undefined){
//            delete $scope.stopConfirmModuleData;
//        }
//        var response = ModuleService.getModuleDetails(moduleUuid);
//        response.then(function(result){            
//            if(result[0]=="GET"){
//                if(result[1]==1){
//                    //$scope.stopConfirmModuleData=[];
//                    var moduleDisplayNames=[];
//                    angular.forEach(result[2].awareOfModules, function(value, key) {
//                      moduleDisplayNames.push(getModuleNameUsingPackageName(value));
//                    });
//                    $scope.stopConfirmModuleData={
//                        "uuid" : moduleUuid,
//                        "awareOfModules" : moduleDisplayNames
//                    }
//                    //$scope.stopConfirmModuleData=result[2];
//                }
//            }
//        });
//        angular.element('#stopConfirmation').modal('show');
//      }
      
      
      $scope.unloadModule = function(moduleUuid){
      	console.log("Unload module");

      	if(typeof($scope.unloadModuleSuccess)!=undefined){
            delete $scope.unloadModuleSuccess;
        }
        if(typeof($scope.unloadModuleError)!=undefined){
            delete $scope.unloadModuleError;
        }

      	var uploadUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/moduleaction";
      	var moduleData = 
                     {
                         "action": "unload",
                         "modules": [moduleUuid]
                     };

      	$http.post(uploadUrl, moduleData ,  {
            headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'}
        }) .success(function (data, status, headers, config) {
            $scope.getAllModuleDetails();
        	$scope.unloadModuleSuccess="Module Unloaded successfully.";
        })
        .error(function (data, status, headers, config) {

        		var x2js = new X2JS();
                var JsonSuccessResponse = x2js.xml_str2json(data);

                if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined"){
                    // File Error Catched
                    if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined"){
                        // Error Message given
                        $scope.unloadModuleError=JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                    }
                    else{
                        // Unknown Error Message
                        $scope.unloadModuleError="Could not unload this Module!"
                    }
                }
                else{
                    //unknown Error
                    $scope.unloadModuleError="Could not unload this Module!"
                }
        });
      }
      
      
      
    $scope.StartAllModules = function(){
      	console.log("start all module");
        
        $scope.isStartAllModules=true;
      	if(typeof($scope.startAllModuleSuccess)!=undefined){
            delete $scope.startAllModuleSuccess;
        }
      	 if(typeof($scope.startAllModuleError)!=undefined){
            delete $scope.startAllModuleError;
        }

      	var uploadUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/moduleaction";
      	var moduleData = 
                     {
                         "action": "start",
                         "allModules": "true"
                     };

      	$http.post(uploadUrl, moduleData ,  {
            headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'}
        }) .success(function (data, status, headers, config) {
            $scope.isStartAllModules=false;
            $scope.getAllModuleDetails();
        	$scope.startAllModuleSuccess="Required action is compeleted. Please check the module's status";
        })
        .error(function (data, status, headers, config) {
        		var x2js = new X2JS();
                var JsonSuccessResponse = x2js.xml_str2json(data);
                $scope.isStartAllModules=false;
                if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined"){
                    // File Error Catched
                    if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined"){
                        // Error Message given
                        $scope.startModuleError=JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                    }
                    else{
                        // Unknown Error Message
                        $scope.startModuleError="Could not complete this action!"
                    }
                }
                else{
                    //unknown Error
                    $scope.startModuleError="Could not complete this action!"
                }
        });
      }

    $scope.getNotInstalledModuleDetailsFromOnline = function() {
        console.log("getNotInstalledModuleDetailsFromOnline");
      	if(typeof($scope.nonInstalledModuleDetails)!=undefined){
            delete $scope.nonInstalledModuleDetails;
        }
        $scope.onlineDataFound=0;
        var legacyId=$routeParams.classUUID;
        var legacyId=legacyId.toString().replace("org.openmrs.","");
        var legacyId=legacyId.toString().replace("module.","");
        console.log(legacyId);
        
        var responseModuleDetails = ModuleService.getModuleDetailsFromOnline(legacyId);
        responseModuleDetails.then(function(resultModule){            
        if(resultModule[0]=="GET"){
            if(resultModule[1]==1){
                if(resultModule[2].totalCount>0){
                    $scope.onlineDataFound=1;
                    console.log("1");
                    $scope.nonInstalledModuleDetails=resultModule[2].items;
                }
                else{console.log("2");
                    $scope.onlineDataFound=-1;
                }
                
                //awareModuleDisplayNames.push([resultAwareModule[2].display,resultAwareModule[2].uuid]);
            }else{console.log("3");
                $scope.onlineDataFound=-1;
               // awareModuleDisplayNames.push([awareModuleName,awareModuleName]);
            }
        } 
        });
    }
    
    $scope.getEffectedModuleListWhenStop = function() {
        console.log("getEffectedModuleListWhenStop");
        var list1=[];
        var response = ModuleService.getAllModuleDetails();
        response.then(function(result){
            responseType=result[0]; //UPLOAD or DOWNLOAD
            responseValue=result[1]; // 1- success | 0 - fail
            responseData=result[2];
            responseStatus=result[3];
            if(responseType=="GET"){
                if(responseValue==1){ //packageName
                    angular.forEach(responseData.results, function(value1, key1) {
                   //     console.log("1 - uid : "+value1.uuid);
                        var requestUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/module/"+value1.uuid;
                        $http.get(requestUrl, {params:{ v : 'full'}})
                        .success(function (data){ // GET REQUEST SUCCESS HANDLE
                            angular.forEach(data.requiredModules, function(value2, key2) {
                                console.log("2 - check : "+value1.packageName+" - "+value2);
                                if(value2==value1.packageName){
                                    console.log("*** 2 - required : "+data.name);
                                    list1.push(data.name);
                                }
                            });
                                
                        });
                    });
                }
                else{
                    console.log("error");
                }
            }
        });
        console.log("Completd : ");
        console.log(list1);
    }
    
    $scope.getModuleViewDetails= function(){
        
       // *** /OpenMRS breadcrumbs ***  
      $rootScope.$emit("updateBreadCrumb", {breadcrumbs : [["SysAdmin","#"],["Modules","#/module-show"], ["Module View",""]]});
      // *** /OpenMRS breadcrumbs ***
        
        console.log("getModuleViewDetails");

        $scope.requestModuleViewDetails=true; // assume the details is available in the system
        
        if(typeof($scope.ModuleViewData)!=undefined){
            delete $scope.ModuleViewData;
        }
      	if(typeof($scope.moduleViewAwareOfModules)!=undefined){
            delete $scope.moduleViewAwareOfModules;
        }
      	if(typeof($scope.moduleViewRequiredModules)!=undefined){
            delete $scope.moduleViewRequiredModules;
        }
        var requestUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/module/"+$routeParams.classUUID;
        $http.get(requestUrl, {params:{ v : 'full'}})
        .success(function (data){ // GET REQUEST SUCCESS HANDLE
            $scope.requestModuleViewDetails=true;
            $scope.ModuleViewData=data;

            
            ////////
                    var awareModuleDisplayNames=[];
                    //console.log(data.awareOfModules);
                    angular.forEach(data.awareOfModules, function(value, key) {
                        //console.log(value);
                        var awareModuleName=value.toString().replace("org.openmrs.module.","");
                        var responseAwareModule = ModuleService.getModuleDetails(awareModuleName);
                        responseAwareModule.then(function(resultAwareModule){            
                            if(resultAwareModule[0]=="GET"){
                                if(resultAwareModule[1]==1){
                                  //  console.log(resultModule[2]);
                                    //return resultModule[2].display;
                                    awareModuleDisplayNames.push([resultAwareModule[2].display,resultAwareModule[2].uuid]);
                                }else{
                                    awareModuleDisplayNames.push([awareModuleName,awareModuleName]);
                                }
                            }else{
                                awareModuleDisplayNames.push([awareModuleName,awareModuleName]);
                            }
                           // console.log(moduleDisplayNames);
                            $scope.moduleViewAwareOfModules={
                                "awareOfModules" : awareModuleDisplayNames
                            }
                            //console.log(awareModuleDisplayNames);
                        });
                    });
            ////////
            ////////
                    var requiredModuleDisplayNames=[];
                    //console.log(data.awareOfModules);
                    angular.forEach(data.requiredModules, function(value, key) {
                        //console.log(value);
                        var requiredModuleName=value.toString().replace("org.openmrs.module.","");
                        var responserequiredModule = ModuleService.getModuleDetails(requiredModuleName);
                        responserequiredModule.then(function(resultRequireModule){            
                            if(resultRequireModule[0]=="GET"){
                                if(resultRequireModule[1]==1){
                                  //  console.log(resultModule[2]);
                                    //return resultModule[2].display;
                                    requiredModuleDisplayNames.push([resultRequireModule[2].display,resultRequireModule[2].uuid]);
                                }else{
                                    requiredModuleDisplayNames.push([capitalizeTxt(requiredModuleName.toString().replace("."," ") ),requiredModuleName]);
                                }
                            }else{
                                requiredModuleDisplayNames.push([capitalizeTxt(requiredModuleName.toString().replace("."," ") ),requiredModuleName]);
                            }
                           // console.log(moduleDisplayNames);
                            $scope.moduleViewRequiredModules={
                                "requiredModules" : requiredModuleDisplayNames
                            }
                           // console.log(requiredModuleDisplayNames);
                        });
                    });
            ////////

            
        }).error(function (data){ // GET REQUEST ERROR HANDLE
            console.log("error");
            $scope.requestModuleViewDetails=false;
        });
    }

    function capitalizeTxt(txt) {
        return txt.charAt(0).toUpperCase() + txt.slice(1);
    }
            
//    $scope.getModuleViewAwareOfModulesNames = function(AwareOfModuleNames){
//      	if(typeof($scope.moduleViewAwareOfModules)!=undefined){
//            delete $scope.moduleViewAwareOfModules;
//        }
//        
////        var response = ModuleService.getModuleDetails(moduleUuid);
////        response.then(function(result){            
////            if(result[0]=="GET"){
////                if(result[1]==1){
//                    //$scope.uploadConfirmModuleData=result[2];
//                    var moduleDisplayNames=[];
//                    console.log(AwareOfModuleNames);
//                    angular.forEach(AwareOfModuleNames, function(value, key) {
//                        console.log(value);
//                        var moduleName=value.toString().replace("org.openmrs.module.","");
//                        var responseModule = ModuleService.getModuleDetails(moduleName);
//                        responseModule.then(function(resultModule){            
//                            if(resultModule[0]=="GET"){
//                                if(resultModule[1]==1){
//                                    console.log(resultModule[2]);
//                                    //return resultModule[2].display;
//                                    moduleDisplayNames.push(resultModule[2].display);
//                                }else{
//                                    moduleDisplayNames.push(moduleName);
//                                }
//                            }else{
//                                moduleDisplayNames.push(moduleName);
//                            }
//                            console.log(moduleDisplayNames);
//                            $scope.moduleViewAwareOfModules={
//                                "awareOfModules" : moduleDisplayNames
//                            }
//                        });
//                    });
//                    //console.log($scope.stopConfirmModuleData);
////                }
////            }
////        });
//      }
//      
      
    $scope.getAllModuleDetails= function(){
        
      // *** /OpenMRS breadcrumbs ***  
      $rootScope.$emit("updateBreadCrumb", {breadcrumbs : [["SysAdmin","#"],["Modules",""]]});
      // *** /OpenMRS breadcrumbs ***
        
        console.log("getAllModuleDetails");
        $scope.requestAllModuleDetails=false;
        if(typeof($scope.AllModuleViewData)!=undefined){
            delete $scope.AllModuleViewData;
        }
        
        var response = ModuleService.getAllModuleDetails();
        response.then(function(result){
            responseType=result[0]; //UPLOAD or DOWNLOAD
            responseValue=result[1]; // 1- success | 0 - fail
            responseData=result[2];
            responseStatus=result[3];
            if(responseType=="GET"){
                if(responseValue==1){
                    $scope.requestAllModuleDetails=true;
                    $scope.AllModuleViewData=responseData.results;
                }
                else{
                    console.log("error");
                    $scope.requestAllModuleDetails=false;
                }
            }
        });
//        var requestUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/module";
//        $http.get(requestUrl, {params:{ v : 'full'}})
//        .success(function (data){ // GET REQUEST SUCCESS HANDLE
//            $scope.requestAllModuleDetails=true;
//            $scope.AllModuleViewData=data.results;
//        }).error(function (data){ // GET REQUEST ERROR HANDLE
//            console.log("error");
//            $scope.requestAllModuleDetails=false;
//        });
    }
    
 
    $scope.checkAllModulesForUpdate=function(){
        
      // *** /OpenMRS breadcrumbs ***  
      $rootScope.$emit("updateBreadCrumb", {breadcrumbs : [["SysAdmin","#"],["Modules","#/module-show"], ["Check for Updates",""]]});
      // *** /OpenMRS breadcrumbs ***
        
        console.log("checkAllModulesForUpdate");
        $scope.searchingForUpdate=true;
        var count=0;
       if(typeof($scope.checkUpdateForAllModuleError)!=undefined){
            delete $scope.checkUpdateForAllModuleError;
        }
        if(typeof($scope.UpdatesFound)!=undefined){
            delete $scope.UpdatesFound;
        }
        var availableUpdateData=[];
        var responseModuleDetails = ModuleService.getAllModuleDetails();
        responseModuleDetails.then(function(resultModule){
            if(resultModule[0]=="GET"){
                if(resultModule[1]==1){
                    console.log("before foreach");
                    responseModuleDetailsData=resultModule[2].results; //data.results
                    angular.forEach(responseModuleDetailsData, function(Modulevalue, Modulekey) {
                        var moduleName=Modulevalue.name;
                        var moduleCurrentVeriosn=Modulevalue.version;
                        //console.log(moduleName);
                        var responseUpdate = ModuleService.checkModuleUpdate(moduleName);
                        responseUpdate.then(function(resultUpdate){
                            count+=1;
                            console.log(count+" , "+resultModule[2].results.length);
                            if(resultUpdate[0]=="GET"){
                                if(resultUpdate[1]==1){
                                    var UpdateData=resultUpdate[2];
                                    if(UpdateData.iTotalDisplayRecords>0){
                                        var compateValue = version_compare(moduleCurrentVeriosn, UpdateData.aaData[0][2]);
                                        if(compateValue==1){
//                                            availableUpdateData.push([Modulevalue.uuid,Modulevalue.name,Modulevalue.display,Modulevalue.author,Modulevalue.description, Modulevalue.version,UpdateData.aaData[0][2],UpdateData.aaData[0][0]]);
                                            availableUpdateData.push({0:Modulevalue.uuid,1:Modulevalue.name,2:Modulevalue.display,3:Modulevalue.author,4:Modulevalue.description, 5:Modulevalue.version,6:UpdateData.aaData[0][2],7:UpdateData.aaData[0][0]});
                                            // UUID, ModuleName, Display,Author,Description,CurrentVersion,AvailableVersion,URL
                                        }
                                    }
                                }
                                else{
                                // error in retrive Module update details
                                $scope.checkUpdateForAllModuleError="Could not get some the module update details."
                                }
                            }
                            else{
                                // error in retrive Module update details
                                $scope.checkUpdateForAllModuleError="Could not get some the module update details."
                            }
                        });
                    });
                            $scope.UpdatesFound=true;
                            $scope.availableUpdateData=availableUpdateData;
                    
//                    }).promise.then(function(){
//                        console.log(availableUpdateData);
//                        console.log(availableUpdateData.length);
//                        $scope.searchingForUpdate=false;
//                        if(availableUpdateData.length>0){
//                            // Updates Found
//                            $scope.UpdatesFound=true;
//                            $scope.availableUpdateData=availableUpdateData;
//                        }
//                        else{
//                            // No Updates Found
//                            $scope.UpdatesFound=false;
//                        }
//                        if(count>=resultModule[2].results.length){
//                            console.log("breaking promise");
//                            return;
//                        }
//                    });
                    //console.log(availableUpdateData);
                }
                else{
                    // error in retrive Module details
                    $scope.checkUpdateForAllModuleError="Could not get the module details."
                }
            }
            else{
                //  Could not fetch Module Details
                $scope.checkUpdateForAllModuleError="Could not get the module list."
            }
            $scope.searchingForUpdate=false;
        });
    }

    
   $scope.checkModuleUpdate = function (moduleUuid, currentVersion){
        var response = ModuleService.checkModuleUpdate(moduleUuid);
        response.then(function(result){
            responseType=result[0]; //UPLOAD or DOWNLOAD
            responseValue=result[1]; // 1- success | 0 - fail
            responseData=result[2];
            responseStatus=result[3];
            if(responseType=="GET"){
                if(responseValue==1){
                     if(responseData.iTotalDisplayRecords>0)
                            {
                                // Modules Found
                                console.log("REST New Version : " + responseData.aaData[0][2]);
                                var compateValue = version_compare(currentVersion, responseData.aaData[0][2]);
                                if(compateValue==0){
                                    // Same Version
                                    $scope.moduleNewUpdateFound="-1"; // same version
                                }
                                else if(compateValue==1){
                                    // New Version Found
                                    $scope.moduleNewUpdateFound="1"; // found
                                    $scope.moduleUpdateURL=responseData.aaData[0][0];
                                }
                                else if(compateValue==-1){
                                    // Upto Data - Server contains older version
                                    $scope.moduleNewUpdateFound="-1"; // no need of update
                                }
                                console.log(responseData.aaData[0][2] + " , " + currentVersion + " : " + compateValue)
                              }
                              else 
                              {
                                // No Modules Found
                                console.log("Error");
                                $scope.moduleNewUpdateFound=false;
                              }
                }
                else{
                    console.error('Repos error', responseStatus, responseData);
                    $scope.moduleNewUpdateFound=false;
                }
            }
        });
                      
   }
        
//   $scope.checkModuleUpdate = function (moduleUuid, currentVersion){
//       var searchValue = moduleUuid;
//       var column_count=1;
//       var columns="CVersion";
//       var displayStart=0;
//       var displayLength=15;
//
//       var urll="https://modules.openmrs.org/modulus/modules/findModules?callback=JSON_CALLBACK&sEcho=13&iColumns="+column_count+"&sColumns="+columns+"&iDisplayStart="+displayStart+"&iDisplayLength="+displayLength+"&bEscapeRegex=true&sSearch="+searchValue;
//       
//       if(typeof($scope.moduleUpdateURL)!=undefined){
//            delete $scope.moduleUpdateURL;
//        }
//       $scope.moduleNewUpdateFound="0"; // working or disabled
//       $http({
//         method: 'JSONP', 
//         url: urll
//       })
//       .success(function(data) {
//         if(data.iTotalDisplayRecords>0)
//                {
//            	  	// Modules Found
//                    console.log("REST New Version : " + data.aaData[0][2]);
//                    var compateValue = version_compare(currentVersion, data.aaData[0][2]);
//                    if(compateValue==0){
//                        // Same Version
//                        $scope.moduleNewUpdateFound="-1"; // same version
//                    }
//                    else if(compateValue==1){
//                        // New Version Found
//                        $scope.moduleNewUpdateFound="1"; // found
//                        $scope.moduleUpdateURL=data.aaData[0][0];
//                    }
//                    else if(compateValue==-1){
//                        // Upto Data - Server contains older version
//                        $scope.moduleNewUpdateFound="-1"; // no need of update
//                    }
//                    console.log(data.aaData[0][2] + " , " + currentVersion + " : " + compateValue)
//            	  }
//            	  else 
//                  {
//            	  	// No Modules Found
//                    console.log("Error");
//            	  	$scope.moduleNewUpdateFound=false;
//            	  }
//              })
//       .error(function(data, status) {
//            console.error('Repos error', status, data);
//            $scope.moduleNewUpdateFound=false;
//       });
//        
//   }

// ******* Version Compare ********
/*
Split a version string into components and map prefixes and suffixes to integers.
Examples:
- 1.0
- 2.0.4
- 1.4RC
- 0.7beta
*/
function version_bits(version) {
    //console.log(version);
   //  console.log(typeof(version);
    version = version.replace(/(\d+)([^\d\.]+)/, "$1.$2");
    version = version.replace(/([^\d\.]+)(\d+)/, "$1.$2");    
    var parts = version.split('.'), 
        rmap = {
            'rc' : -1,
            'pre' : -2,            
            'beta' : -3,
            'b' : -3,            
            'alpha' : -4,
            'a' : -4,            
        },
        v, n;
    
    var bits = [];
    for (var i = 0; i < parts.length; ++i) {
        v = parts[i];
            
        n = parseInt(v, 10);
        if ( isNaN(n) ) {
            n = rmap[v] || -1;
        }
        bits.push(n);
    }    
    return bits;
}

/*
Compare different software version strings.
Returns 0 if same, -1 if version2 is older or 1 if version2 is newer.
*/
function version_compare(version1, version2) {
   // console.log(version1+" , "+version2)
    var v1parts = version_bits(version1);
    var v2parts = version_bits(version2);
    var v2, v1;
    
    for (var i = 0; i < Math.max(v1parts.length, v2parts.length); ++i) {
        v1 = v1parts[i] || 0;
        v2 = v2parts[i] || 0;
        
        if (v2 > v1) {
            return 1;
        }
        else if (v1 > v2) {
            return -1;
        }
    }
        
    return 0;
}
// ******* Version Compare ********

            
}]);




managemoduleController.controller('ModuleEditCtrl', ['$scope', 'ModulesServicess', '$routeParams',  function($scope, ModulesServicess, $routeParams ) {
      $scope.singleClass = ModulesServicess.getClass({uuid : $routeParams.classUUID});
  }]);

