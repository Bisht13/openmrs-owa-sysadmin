var manageModuleController = angular.module('manageModuleController', ['OWARoutes']);


manageModuleController.controller('ModuleListCtrl',
    ['$scope', '$location', '$route', '$routeParams', 'OWARoutesUtil', '$http', '$rootScope', 'ModuleService', 'logger',
        function ($scope, $location, $route, $routeParams, OWARoutesUtil, $http, $rootScope, ModuleService, logger) {

            // OpenMRS breadcrumbs
            $rootScope.$emit("updateBreadCrumb", {breadcrumbs: [["SysAdmin", "#"], ["Modules", ""]]});

            //holds objects of selected checkboxes
            $scope.selected = {};

            function showLoadingPopUp() {
                $('#loadingModal').show();
                $('#loadingModal').modal({
                    backdrop: 'static',
                    keyboard: false
                });
            }

            function hideLoadingPopUp() {
                angular.element('#loadingModal').modal('hide');
            }

            function alertsClear() {
                if (typeof($scope.startModuleSuccess) != undefined) {
                    delete $scope.startModuleSuccess;
                }
                if (typeof($scope.startModuleError) != undefined) {
                    delete $scope.startModuleError;
                }
                if (typeof($scope.stopModuleSuccess) != undefined) {
                    delete $scope.stopModuleSuccess;
                }
                if (typeof($scope.stopModuleError) != undefined) {
                    delete $scope.stopModuleError;
                }
                if (typeof($scope.unloadModuleSuccess) != undefined) {
                    delete $scope.unloadModuleSuccess;
                }
                if (typeof($scope.unloadModuleError) != undefined) {
                    delete $scope.unloadModuleError;
                }
                if (typeof($scope.startAllModuleSuccess) != undefined) {
                    delete $scope.startAllModuleSuccess;
                }
                if (typeof($scope.startAllModuleError) != undefined) {
                    delete $scope.startAllModuleError;
                }

                if (typeof($scope.checkUpdateForAllModuleError) != undefined) {
                    delete $scope.checkUpdateForAllModuleError;
                }
                if (typeof($scope.UpdatesFound) != undefined) {
                    delete $scope.UpdatesFound;
                }
                if (typeof($scope.moduleUpdateURL) != undefined) {
                    delete $scope.moduleUpdateURL;
                }
            }

            $scope.updateModule = function (moduleUrl) {
                console.log("update Module");
                // Remove the notification about Update
                if (typeof($scope.moduleUpdateURL) != undefined) {
                    delete $scope.moduleUpdateURL;
                }
                $scope.moduleNewUpdateFound = "0"; // working or disabled
                alertsClear(); // clear all alerts $scope variables
                showLoadingPopUp(); // Show loadingPop to prevent other Actions
                $scope.isDownloading = true;
                var response = ModuleService.uploadModules(moduleUrl);
                response.then(function (result) {
                    responseType = result[0]; //UPLOAD or DOWNLOAD
                    responseValue = result[1]; // 1- success | 0 - fail
                    responseData = result[2];
                    responseStatus = result[3];

                    if (responseType == "UPLOAD") {
                        $scope.isDownloading = false;
                        $scope.downloadSuccessMsg = "Module Download Completed";
                        if (responseValue == 1) {
                            $scope.isUploading = false;
                            var x2js = new X2JS();
                            var JsonSuccessResponse = x2js.xml_str2json(responseData);
                            var moduleName = JsonSuccessResponse["org.openmrs.module.Module"].name;
                            uplodedsuccessMsg = moduleName + " has been loaded"
                            responseJsonData = JsonSuccessResponse;
                            if (typeof(JsonSuccessResponse["org.openmrs.module.Module"].startupErrorMessage) == "undefined") {
                                // Started Successfully
                                $scope.startupsuccessMsg = moduleName + " has been loaded and started Successfully"
                                $scope.checkAllModulesForUpdate();
                            }
                            else {
                                //start up Error Found
                                $scope.startuperrorMsg = "Could not start " + moduleName + " Module."
                                logger.error($scope.startuperrorMsg);
                            }
                            hideLoadingPopUp();
                        }
                        else {
                            $scope.isUploading = false;
                            var x2js = new X2JS();
                            var JsonErrorResponse = x2js.xml_str2json(responseData);
                            if (typeof(JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined") {
                                // File Error Catched
                                if (typeof(JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined") {
                                    // Error Message given
                                    $scope.uploadederrorMsg = JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                                }
                                else {
                                    // Unknown Error Message
                                    $scope.uploadederrorMsg = "Error loading module, no config.xml file found"
                                }
                            }
                            else {
                                //unknown Error
                                $scope.uploadederrorMsg = "Error loading module!"
                            }
                            hideLoadingPopUp();
                            logger.error($scope.uploadederrorMsg, responseData);
                        }
                    }
                    else {
                        $scope.isDownloading = false;
                        $scope.downloadErrorMsg = "Could not download the Module";
                        hideLoadingPopUp();
                        logger.error($scope.downloadErrorMsg, responseData);
                    }
                });
            }

            $scope.go = function (path) {
                $location.path(path);
            };

            $scope.redirect = function () {
                window.location = "#/page.html";
            }

            $scope.StartModule = function (moduleUuid, resource, moduleDisplayName) {
                $scope.isStartModule = true;
                alertsClear(); // clear all alerts $scope variables
                showLoadingPopUp(); // Show loadingPop to prevent other Actions
                var uploadUrl = OWARoutesUtil.getOpenmrsUrl() + "/ws/rest/v1/moduleaction";
                var moduleData =
                    {
                        "action": "start",
                        "modules": [moduleUuid]
                    };

                $http.post(uploadUrl, moduleData, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    }
                }).success(function (data, status, headers, config) {
                    $scope.isStartModule = false;
                    if (resource == "ALLMODULES") {
                        $scope.getAllModuleDetails();
                    }
                    else {
                        $scope.getModuleViewDetails();
                    }
                    $scope.startModuleSuccess = "Module " + moduleDisplayName + " has been started successfully.";
                    hideLoadingPopUp();
                }).error(function (data, status, headers, config) {
                        $scope.isStartModule = false;
                        var x2js = new X2JS();
                        var JsonSuccessResponse = x2js.xml_str2json(data);

                        if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined") {
                            // File Error Catched
                            if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined") {
                                // Error Message given
                                $scope.startModuleError = JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                            }
                            else {
                                // Unknown Error Message
                                $scope.startModuleError = "Action failed, Could not start the " + moduleDisplayName + " module!"
                            }
                        }
                        else {
                            //unknown Error
                            $scope.startModuleError = "Action failed, Could not start the " + moduleDisplayName + " module!"
                        }
                        hideLoadingPopUp();
                        logger.error($scope.startModuleError, data);
                    });
            }

            $scope.StopModule = function (moduleUuid, resource, moduleDisplayName) {
                $scope.isStopModule = true;
                alertsClear(); // clear all alerts $scope variables
                showLoadingPopUp(); // Show loadingPop to prevent other Actions

                var uploadUrl = OWARoutesUtil.getOpenmrsUrl() + "/ws/rest/v1/moduleaction";
                var moduleData =
                    {
                        "action": "stop",
                        "modules": [moduleUuid]
                    };

                $http.post(uploadUrl, moduleData, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    }
                }).success(function (data, status, headers, config) {
                    $scope.isStopModule = false;
                    if (resource == "ALLMODULES") {
                        $scope.getAllModuleDetails();
                    }
                    else {
                        $scope.getModuleViewDetails();
                    }
                    $scope.stopModuleSuccess = "Module " + moduleDisplayName + " has been Stopped successfully.";
                    hideLoadingPopUp();
                }).error(function (data, status, headers, config) {
                        $scope.isStopModule = false;
                        var x2js = new X2JS();
                        var JsonSuccessResponse = x2js.xml_str2json(data);

                        if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined") {
                            // File Error Catched
                            if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined") {
                                // Error Message given
                                $scope.stopModuleError = JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                            }
                            else {
                                // Unknown Error Message
                                $scope.stopModuleError = "Action failed, Could not stop the " + moduleDisplayName + " mdule!"
                            }
                        }
                        else {
                            //unknown Error
                            $scope.stopModuleError = "Action failed, Could not stop the " + moduleDisplayName + " module!"
                        }
                        hideLoadingPopUp();
                        logger.error($scope.stopModuleError, data);
                    });
            }

            $scope.unloadConfirmationShow = function (packagename, moduleUuid, moduleDisplayName) {
                if (typeof($scope.uploadConfirmModuleData) != undefined) {
                    delete $scope.uploadConfirmModuleData;
                }
                var moduleDisplayNames = [];
                var response = ModuleService.getAllModuleDetails();
                response.then(function (result) {
                    responseType = result[0]; //UPLOAD or DOWNLOAD
                    responseValue = result[1]; // 1- success | 0 - fail
                    responseData = result[2];
                    responseStatus = result[3];
                    if (responseType == "GET") {
                        if (responseValue == 1) {
                            angular.forEach(responseData.results, function (value1, key1) {
                                angular.forEach(value1.requiredModules, function (value2, key2) {
                                    if (packagename == value2) {
                                        moduleDisplayNames.push(value1.name);
                                    }
                                });
                            });
                            $scope.uploadConfirmModuleData = {
                                "uuid": moduleUuid,
                                "moduleDisplayName": moduleDisplayName,
                                "requiredModules": moduleDisplayNames
                            }
                        }
                        else {
                            logger.error("Could not get required module details to perform unload the module", responseData);
                        }
                    }
                });
                angular.element('#deleteConfirmation').modal('show');
            }

            $scope.stopConfirmationShow = function (packagename, moduleUuid, moduleDisplayName) {
                if (typeof($scope.stopConfirmModuleData) != undefined) {
                    delete $scope.stopConfirmModuleData;
                }
                var moduleDisplayNames = [];
                var response = ModuleService.getAllModuleDetails();
                response.then(function (result) {
                    responseType = result[0]; //UPLOAD or DOWNLOAD
                    responseValue = result[1]; // 1- success | 0 - fail
                    responseData = result[2];
                    responseStatus = result[3];
                    if (responseType == "GET") {
                        if (responseValue == 1) {
                            angular.forEach(responseData.results, function (value1, key1) {
                                angular.forEach(value1.requiredModules, function (value2, key2) {
                                    // console.log("2 - check : "+value1.packageName+" - "+value2);
                                    if (packagename == value2) {
                                        moduleDisplayNames.push(value1.name);
                                    }
                                });
                            });
                            $scope.stopConfirmModuleData = {
                                "uuid": moduleUuid,
                                "moduleDisplayName": moduleDisplayName,
                                "requiredModules": moduleDisplayNames
                            }
                        }
                        else {
                            logger.error("Could not get required module details to perform stop the module", responseData);
                        }
                    }
                });
                angular.element('#stopConfirmation').modal('show');
            }

            $scope.unloadModule = function (moduleUuid, moduleDisplayName) {
                $scope.isUnloadModule = true;
                alertsClear(); // clear all alerts $scope variables
                showLoadingPopUp(); // Show loadingPop to prevent other Actions

                var uploadUrl = OWARoutesUtil.getOpenmrsUrl() + "/ws/rest/v1/moduleaction";
                var moduleData =
                    {
                        "action": "unload",
                        "modules": [moduleUuid]
                    };

                $http.post(uploadUrl, moduleData, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    }
                }).success(function (data, status, headers, config) {
                    $scope.getAllModuleDetails();
                    $scope.isUnloadModule = false;
                    $scope.unloadModuleSuccess = "Module " + moduleDisplayName + " has been unloaded successfully.";
                    hideLoadingPopUp();
                }).error(function (data, status, headers, config) {
                        $scope.isUnloadModule = false;
                        var x2js = new X2JS();
                        var JsonSuccessResponse = x2js.xml_str2json(data);

                        if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined") {
                            // File Error Catched
                            if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined") {
                                // Error Message given
                                $scope.unloadModuleError = JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                            }
                            else {
                                // Unknown Error Message
                                $scope.unloadModuleError = "Action failed, Could not unload the " + moduleDisplayName + " module!"
                            }
                        }
                        else {
                            //unknown Error
                            $scope.unloadModuleError = "Action failed, Could not unload the " + moduleDisplayName + " module!"
                        }
                        hideLoadingPopUp();
                        logger.error($scope.unloadModuleError, data);
                    });
            }


            $scope.StartAllModules = function () {
                $scope.isStartAllModules = true;
                alertsClear(); // clear all alerts $scope variables
                showLoadingPopUp(); // Show loadingPop to prevent other Actions

                var uploadUrl = OWARoutesUtil.getOpenmrsUrl() + "/ws/rest/v1/moduleaction";
                var moduleData =
                    {
                        "action": "start",
                        "allModules": "true"
                    };

                $http.post(uploadUrl, moduleData, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    }
                }).success(function (data, status, headers, config) {
                    $scope.isStartAllModules = false;
                    $scope.getAllModuleDetails();
                    $scope.startAllModuleSuccess = "Action completed successfully. Please check the module's status";
                    hideLoadingPopUp();
                }).error(function (data, status, headers, config) {
                        var x2js = new X2JS();
                        var JsonSuccessResponse = x2js.xml_str2json(data);
                        $scope.isStartAllModules = false;
                        if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined") {
                            // File Error Catched
                            if (typeof(JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1]) != "undefined") {
                                // Error Message given
                                $scope.startModuleError = JsonSuccessResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry[0].string[1];
                            }
                            else {
                                // Unknown Error Message
                                $scope.startModuleError = "Action Failed, Could not start all the modules!"
                            }
                        }
                        else {
                            //unknown Error
                            $scope.startModuleError = "Action Failed, Could not start all the modules!"
                        }
                        hideLoadingPopUp();
                        logger.error($scope.startModuleError, data);
                    });
            }

            $scope.getNotInstalledModuleDetailsFromOnline = function () {
                if (typeof($scope.nonInstalledModuleDetails) != undefined) {
                    delete $scope.nonInstalledModuleDetails;
                }
                if (typeof($scope.onlineDataFound) != undefined) {
                    delete $scope.onlineDataFound;
                }
                showLoadingPopUp(); // Show loadingPop to prevent other Actions
                var modulePackageName = $routeParams.classUUID;
                var responseModuleDetails = ModuleService.getModuleDetailsFromOnline(modulePackageName);
                responseModuleDetails.then(function (resultModule) {
                    if (resultModule[0] == "GET") {
                        if (resultModule[1] == 1) {
                            $scope.onlineDataFound = true;
                            $scope.nonInstalledModuleDetails = resultModule[2];
                        } else {
                            $scope.onlineDataFound = false;
                            logger.error("Could not get information from the online - AddOns", resultModule[2]);
                        }
                        hideLoadingPopUp() // hide the loading Popup
                    }
                });
            }

            $scope.getDependentModuleListonCurrentModule = function (packagename) {
                //var packagename="org.openmrs.module.uiframework";
                if (typeof($scope.DependentModuleList) != undefined) {
                    delete $scope.DependentModuleList;
                }
                var Modulelist = [];
                var response = ModuleService.getAllModuleDetails();
                response.then(function (result) {
                    responseType = result[0]; //UPLOAD or DOWNLOAD
                    responseValue = result[1]; // 1- success | 0 - fail
                    responseData = result[2];
                    responseStatus = result[3];
                    if (responseType == "GET") {
                        if (responseValue == 1) {
                            angular.forEach(responseData.results, function (value1, key1) {
                                angular.forEach(value1.requiredModules, function (value2, key2) {
                                    // console.log("2 - check : "+value1.packageName+" - "+value2);
                                    if (packagename == value2) {
                                        Modulelist.push([value1.name, value1.uuid]);
                                    }
                                });
                            });
                            $scope.DependentModuleList = Modulelist;
                        }
                        else {
                            logger.error("Could not get the dependent module information", resultModule[2]);
                        }
                    }
                });
            }

            $scope.getModuleViewDetails = function () {
                // OpenMRS breadcrumbs
                $rootScope.$emit("updateBreadCrumb", {breadcrumbs: [["SysAdmin", "#"], ["Modules", "#/module-show"], ["Module View", ""]]});

                if (typeof($scope.requestModuleViewDetails) != undefined) {
                    delete $scope.requestModuleViewDetails;
                }
                if (typeof($scope.ModuleViewData) != undefined) {
                    delete $scope.ModuleViewData;
                }
                if (typeof($scope.moduleViewAwareOfModules) != undefined) {
                    delete $scope.moduleViewAwareOfModules;
                }
                if (typeof($scope.moduleViewRequiredModules) != undefined) {
                    delete $scope.moduleViewRequiredModules;
                }
                showLoadingPopUp();

                var requestUrl = OWARoutesUtil.getOpenmrsUrl() + "/ws/rest/v1/module/" + $routeParams.classUUID;
                $http.get(requestUrl, {params: {v: 'full'}})
                    .success(function (data) { // GET REQUEST SUCCESS HANDLE
                        $scope.requestModuleViewDetails = true;
                        $scope.ModuleViewData = data;

                        var awareModuleDisplayNames = [];
                        //console.log(data.awareOfModules);
                        angular.forEach(data.awareOfModules, function (value, key) {
                            //console.log(value);
                            var awareModuleName = value.toString().replace("org.openmrs.module.", "");
                            var responseAwareModule = ModuleService.getModuleDetails(awareModuleName);
                            responseAwareModule.then(function (resultAwareModule) {
                                if (resultAwareModule[0] == "GET") {
                                    if (resultAwareModule[1] == 1) {
                                        //  console.log(resultModule[2]);
                                        //return resultModule[2].display;
                                        awareModuleDisplayNames.push([resultAwareModule[2].display, resultAwareModule[2].uuid]);
                                    } else {
                                        awareModuleDisplayNames.push([awareModuleName, awareModuleName]);
                                        logger.error("Could not get module information for - " + awareModuleName, resultAwareModule[2]);
                                    }
                                } else {
                                    awareModuleDisplayNames.push([awareModuleName, awareModuleName]);
                                }
                                $scope.moduleViewAwareOfModules = {
                                    "awareOfModules": awareModuleDisplayNames
                                }
                            });
                        });

                        var requiredModuleDisplayNames = [];
                        angular.forEach(data.requiredModules, function (value, key) {

                            var requiredModuleName = value.toString().replace("org.openmrs.module.", "");
                            var responserequiredModule = ModuleService.getModuleDetails(requiredModuleName);
                            responserequiredModule.then(function (resultRequireModule) {
                                if (resultRequireModule[0] == "GET") {
                                    if (resultRequireModule[1] == 1) {
                                        requiredModuleDisplayNames.push([resultRequireModule[2].display, resultRequireModule[2].uuid]);
                                    } else {
                                        requiredModuleDisplayNames.push([capitalizeTxt(requiredModuleName.toString().replace(".", " ")), requiredModuleName]);
                                        logger.error("Could not get module information for - " + requiredModuleName, resultRequireModule[2]);
                                    }
                                } else {
                                    requiredModuleDisplayNames.push([capitalizeTxt(requiredModuleName.toString().replace(".", " ")), requiredModuleName]);
                                }
                                $scope.moduleViewRequiredModules = {
                                    "requiredModules": requiredModuleDisplayNames
                                }
                            });
                        });

                        $scope.getDependentModuleListonCurrentModule(data.packageName);

                        hideLoadingPopUp();
                    }).error(function (data) { // GET REQUEST ERROR HANDLE
                    $scope.requestModuleViewDetails = false;
                    hideLoadingPopUp();
                    logger.error("Could not get module view details", data);
                });
            }

            function capitalizeTxt(txt) {
                return txt.charAt(0).toUpperCase() + txt.slice(1);
            }


            $scope.getAllModuleDetails = function () {
                //OpenMRS breadcrumbs
                $rootScope.$emit("updateBreadCrumb", {breadcrumbs: [["SysAdmin", "#"], ["Modules", ""]]});

                $scope.requestAllModuleDetails = false;
                if (typeof($scope.AllModuleViewData) != undefined) {
                    delete $scope.AllModuleViewData;
                }

                var response = ModuleService.getAllModuleDetails();
                response.then(function (result) {
                    responseType = result[0]; //UPLOAD or DOWNLOAD
                    responseValue = result[1]; // 1- success | 0 - fail
                    responseData = result[2];
                    responseStatus = result[3];
                    if (responseType == "GET") {
                        if (responseValue == 1) {
                            $scope.requestAllModuleDetails = true;
                            $scope.AllModuleViewData = responseData.results;
                        }
                        else {
                            $scope.requestAllModuleDetails = false;
                            logger.error("Could not get all module information", responseData);
                        }
                    }
                });
            }


            $scope.checkAllModulesForUpdate = function () {

                //OpenMRS breadcrumbs
                $rootScope.$emit("updateBreadCrumb", {breadcrumbs: [["SysAdmin", "#"], ["Modules", "#/module-show"], ["Check for Updates", ""]]});

                alertsClear();
                showLoadingPopUp();
                $scope.searchingForUpdate = true;
                var count = 0;

                $scope.updateErrorModules = [];
                var availableUpdateData = [];
                var responseModuleDetails = ModuleService.getAllModuleDetails();
                responseModuleDetails.then(function (resultModule) {
                    if (resultModule[0] == "GET") {
                        if (resultModule[1] == 1) {
                            responseModuleDetailsData = resultModule[2].results; //data.results
                            angular.forEach(responseModuleDetailsData, function (Modulevalue, Modulekey) {

                                var moduleCurrentVeriosn = Modulevalue.version;
                                var responseUpdate = ModuleService.checkModuleUpdate(Modulevalue.packageName);
                                responseUpdate.then(function (resultUpdate) {
                                    if (resultUpdate[0] == "GET") {
                                        if (resultUpdate[1] == 1) {
                                            var UpdateData = resultUpdate[2];
                                            var compateValue = version_compare(moduleCurrentVeriosn, UpdateData.latestVersion);
                                            if (compateValue == 1) {
                                                var updateObj = {
                                                    "uuid": Modulevalue.uuid,
                                                    "name": Modulevalue.name,
                                                    "display": Modulevalue.display,
                                                    "author": Modulevalue.author,
                                                    "description": Modulevalue.description,
                                                    "version": Modulevalue.version,
                                                    "newversion": UpdateData.latestVersion,
                                                    "downloadurl": UpdateData.versions[0].downloadUri

                                                }
                                                availableUpdateData.push(updateObj);
                                            }
                                        }
                                        else {
                                            // error in retrive Module update details
                                            $scope.updateErrorModules.push(Modulevalue.name);
                                            $scope.checkUpdateForAllModuleError = "Could not get some the module update details."
                                            logger.error("Modulevalue.packageName : " + Modulevalue.packageName, resultUpdate[1]);
                                        }

                                        hideLoadingPopUp();
                                    }
                                    else {
                                        // error in retrive Module update details
                                        if (count >= responseModuleDetailsData.length) {
                                            $scope.searchingForUpdate = false;
                                        }
                                        hideLoadingPopUp();
                                        $scope.updateErrorModules.push(Modulevalue.name);
                                        $scope.checkUpdateForAllModuleError = "Could not get some the module update details."
                                        logger.error("Modulevalue.packageName : " + Modulevalue.packageName, resultUpdate[1]);
                                    }
                                });
                            });
                            $scope.UpdatesFound = true;
                            $scope.availableUpdateData = availableUpdateData;
                        }
                        else {
                            // error in retrive Module details
                            $scope.searchingForUpdate = false;
                            $scope.checkUpdateForAllModuleError = "Could not get the module details.";
                            hideLoadingPopUp();
                            logger.error($scope.checkUpdateForAllModuleError, resultModule[1]);
                        }
                    }
                    else {
                        //  Could not fetch Module Details
                        $scope.searchingForUpdate = false;
                        $scope.checkUpdateForAllModuleError = "Could not get the module list.";
                        hideLoadingPopUp();
                        logger.error($scope.checkUpdateForAllModuleError + Modulevalue.packageName, resultModule[1]);
                    }

                });
            }


            $scope.checkModuleUpdate = function (moduleUuid, modulePackage, currentVersion) {

                alertsClear(); // clear all alerts $scope variables
                showLoadingPopUp(); // Show loadingPop to prevent other Actions
                var response = ModuleService.checkModuleUpdate(modulePackage);
                response.then(function (result) {
                    responseType = result[0]; //UPLOAD or DOWNLOAD
                    responseValue = result[1]; // 1- success | 0 - fail
                    responseData = result[2];
                    responseStatus = result[3];
                    if (responseType == "GET") {
                        if (responseValue == 1) {
                            // Modules Found
                            var compateValue = version_compare(currentVersion, responseData.latestVersion);
                            if (compateValue == 0) {
                                // Same Version
                                $scope.moduleNewUpdateFound = "-1"; // same version
                            }
                            else if (compateValue == 1) {
                                // New Version Found
                                $scope.moduleNewUpdateFound = "1"; // found
                                $scope.moduleUpdateURL = responseData.versions[0].downloadUri;
                            }
                            else if (compateValue == -1) {
                                // Upto Data - Server contains older version
                                $scope.moduleNewUpdateFound = "-1"; // no need of update
                            }
                        }
                        else {
                            // No Modules Found
                            $scope.moduleNewUpdateFound = false;
                            logger.error("Could not check module information", responseData);
                        }
                        hideLoadingPopUp();
                    }
                });

            }

            function getIndexNameforAddons(moduleName, moduleuuid) {
                var returnValue = '';
                if (moduleName.indexOf(" ") == -1) {
                    // no space in module name
                    returnValue = "org.openmrs.module." + moduleuuid;
                    return returnValue;
                }
                else {
                    // space in module name
                    returnValue = replaceAll(moduleName, " ", "-");
                    returnValue = returnValue.toLocaleLowerCase();
                    returnValue = "org.openmrs.module." + returnValue;
                    return returnValue;
                }
            }

            function replaceAll(str, find, replace) {
                while (str.indexOf(find) > -1) {
                    str = str.replace(find, replace);
                }
                return str;
            }

            /*
             Split a version string into components and map prefixes and suffixes to integers.
             Examples:
             - 1.0
             - 2.0.4
             - 1.4RC
             - 0.7beta
             */
            function version_bits(version) {
                version = version.replace(/(\d+)([^\d\.]+)/, "$1.$2");
                version = version.replace(/([^\d\.]+)(\d+)/, "$1.$2");
                var parts = version.split('.'),
                    rmap = {
                        'rc': -1,
                        'pre': -2,
                        'beta': -3,
                        'b': -3,
                        'alpha': -4,
                        'a': -4,
                    },
                    v, n;

                var bits = [];
                for (var i = 0; i < parts.length; ++i) {
                    v = parts[i];

                    n = parseInt(v, 10);
                    if (isNaN(n)) {
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


        }]);




 

