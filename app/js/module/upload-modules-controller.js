var uploadModule = angular.module('uploadModuleController', ['OWARoutes']);

uploadModule.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);


uploadModule.controller('uploadModuleCtrl', ['$scope','$http','OWARoutesUtil', function($scope,$http,OWARoutesUtil){
    
    $scope.PostDataResponse ='';
    $scope.ResponseDetails ='';

    $scope.uploadFile = function(){
        var file = $scope.myFile;

        var uploadUrl = OWARoutesUtil.getOpenmrsUrl()+"/ws/rest/v1/module/?";

        var fd = new FormData();
        fd.append('file', file);


        $scope.isUploading=true;

        //delete previous uploading messages
        if(typeof($scope.startuperrorMsg)!=undefined){
            delete $scope.startuperrorMsg;
        }
        if(typeof($scope.startupsuccessMsg)!=undefined){
            delete $scope.startupsuccessMsg;
        }
        if(typeof($scope.uplodedsuccessMsg)!=undefined){
            delete $scope.uplodedsuccessMsg;
        }
        if(typeof($scope.uploadederrorMsg)!=undefined){
            delete $scope.uploadederrorMsg;
        }

        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {
            'Content-Type': undefined ,  
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'}
        }) .success(function (data, status, headers, config) {

                $scope.isUploading=false;
                var x2js = new X2JS();
                var JsonSuccessResponse = x2js.xml_str2json(data);
            

                var moduleName = JsonSuccessResponse["org.openmrs.module.Module"].name;
                $scope.uplodedsuccessMsg=moduleName+" has been loaded"
                $scope.responseJsonData=JsonSuccessResponse;



                if (typeof(JsonSuccessResponse["org.openmrs.module.Module"].startupErrorMessage) == "undefined")
                    {
                        // Started Successfully
                        $scope.startupsuccessMsg=moduleName+" has been loaded and started Successfully"
                    }
                else{
                        //start up Error Found 
                        $scope.startuperrorMsg="Could not start "+moduleName+" Module."
                }
            })
            .error(function (data, status, header, config) {
                //console.log("err");
                $scope.isUploading=false;
                var x2js = new X2JS();
                var JsonErrorResponse = x2js.xml_str2json(data);

                if (typeof(JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map.string) != "undefined"){
                    // File Error Catched
                    if (typeof(JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry.string) != "undefined"){
                        // Error Message given
                        $scope.uploadederrorMsg=JsonErrorResponse["org.openmrs.module.webservices.rest.SimpleObject"].map["linked-hash-map"].entry.string;
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
                
            });

    };
    
}]);
