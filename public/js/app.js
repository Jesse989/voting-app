var app = angular.module('app', ["chart.js",'ngRoute', 'ngResource']);

app.factory('postService', function($resource){
    return $resource('/api/polls/:id', null,
    {
        'update': { method:'PUT' }
    });
});

app.service('sharedProperties', function () {
    var current_user = {
        username: "",
        password: ""
    };
    

    return {
        getUsername: function () {
            return current_user.username;
        },
        setUsername: function(value) {
            current_user.username = value;
        },
        getPassword: function () {
            return current_user.password;
        },
        setPassword: function(value) {
            current_user.password = value;
        }
    };
});

app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'main.html',
            controller: 'chartController'
        })
        .when('/login', {
            templateUrl: 'login.html',
            controller: 'authController'
        })
        .when('/register', {
            templateUrl: 'register.html',
            controller: 'authController'
        })
        .when('/poll', {
            templateUrl: 'poll.html',
            controller: 'chartController'
        })
        .when('/createpoll', {
            templateUrl: 'createPoll.html',
            controller: 'chartController'
        })
        .when('/delete', {
            templateUrl: 'delete.html',
            controller: 'deleteController'
        });
});

app.config(['ChartJsProvider', function (ChartJsProvider) {
    // Configure all charts 
    ChartJsProvider.setOptions({
      responsive: true
    });
  }]);
  
app.run(function($rootScope, sharedProperties, $http){
    $rootScope.authenticated = false;
    $http.get('api/ip').then(function(response){
        $rootScope.ip = response.data;
        sharedProperties.setUsername($rootScope.ip);
    });
});

app.controller("deleteController", ['sharedProperties', 'postService', '$scope', '$http', function (sharedProperties, postService, $scope, $http) {
    $scope.polls = postService.query();
    $scope.username = sharedProperties.getUsername();
    $scope.deleteConfirmation = false;
    
    $scope.delete = function($event) {

            postService.remove({id:$event.target.id});
            $scope.polls = postService.query();
            $scope.success_message = "Succesfully removed poll";
       
    };
}]);


app.controller("chartController", ['sharedProperties', 'postService', '$scope', '$timeout', '$location', '$rootScope', function (sharedProperties, postService, $scope, $timeout, $location, $rootScope) {
    $scope.polls = postService.query();
    $scope.choice = "";
    $scope.error_message = "";
    $scope.success_message = "";
    $scope.id = "";

    $scope.newPoll = { 
        created_at: "",
        created_by: "",
        title: "",
        choices: [],
        votes: [],
        con: []
    };
    
    
    $scope.insertOptions = function(){
        $scope.newPoll.choices.push($scope.choice);
        $scope.newPoll.votes.push(1);
        $scope.choice = "";
    };
 
    $scope.toTitleCase = function(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
    
    $scope.changeLocation = function(url, forceReload) {
        $scope = $scope || angular.element(document).scope();
        if(forceReload || $scope.$$phase) {
            window.location = url;
        }
    };

    
    $scope.createPoll = function(){
        $scope.newPoll.created_by = sharedProperties.getUsername(); //TODO change to rootscope current user
        $scope.newPoll.created_at = Date.now();
        
        if($scope.newPoll.choices.length < 2){
            $scope.error_message = 'Enter at least two choices!';
        } else {
            $scope.newPoll.title = $scope.toTitleCase($scope.newPoll.title);
            for(var i in $scope.newPoll.choices){
                $scope.newPoll.choices[i] = $scope.toTitleCase($scope.newPoll.choices[i]);
            }
            postService.save($scope.newPoll, function(){
    
                $scope.polls = postService.query();
                $scope.newPoll = { 
                    created_at: "",
                    created_by: "",
                    title: "",
                    choices: [],
                    votes: [],
                    con: []
                };
            });
            $scope.success_message = 'Poll created succesfully';
            
            $scope.changeLocation('#/poll', false);
            
        }
    };

    $scope.viewPoll = function($event) {
        
        $scope.success_message = "";  
        
        var poll = postService.get({id:$event.target.id}, function() {
            $scope.id = poll._id;
            $scope.labels = poll.choices;
            $scope.series = poll.title;
            $scope.data = poll.votes; 
            $scope.con = poll.con;
             
        });
        
        
        $scope.eligible = $scope.canAdd();  
       
    };
    

    $scope.addOption = function() {
        if($scope.canVote()){
            if($scope.labels.indexOf($scope.toTitleCase($scope.choice)) === -1){
                $scope.labels.push($scope.toTitleCase($scope.choice));
                $scope.data.push(1);
                $scope.update();
                $scope.choice = "";
                $scope.success_message = "Added succesfully";
            }else {
                alert("That is already an option.");
                $scope.choice = "";
            }
        } else {
            alert("You already added or voted!");
            $scope.choice = "";
        }
    };
  
    $scope.onClick = function (points) {
        
        if($scope.canVote()){
            $scope.data[points[0]._index] += 1;
            $scope.update();
            $scope.success_message = "Thanks for your vote!";
        } else {
            alert("You have already voted")
        }
    };
  
    $scope.update = function() {
            $scope.con.push(sharedProperties.getUsername());
            var data = {votes: $scope.data, choices: $scope.labels, title: $scope.title, con: $scope.con};
            postService.update({ id:$scope.id }, data);
    };
  
    $scope.canVote = function(){
        if($scope.con.indexOf(sharedProperties.getUsername()) === -1){
            return true;
        } else {
            return false;
        }
    };
    
    $scope.canAdd = function() {
        if($rootScope.authenticated){
            return true;
        } else {
            return false;
        }
    };
    
    
        
    // async data update 
    $timeout(function () {
        $scope.data;
    }, 1000);
}]);


app.controller('authController', function(sharedProperties, $scope, $http, $location, $rootScope){
    $scope.user = {username: '', password: ''};
    $scope.error_message = '';
    
    
    
    $rootScope.signout = function(){
        $http.get('auth/signout');
        $rootScope.authenticated = false;
        sharedProperties.setUsername($rootScope.ip);
        sharedProperties.setPassword("");
        $location.path('/');
    };
    
    $scope.login = function(){
        $http.post('/auth/login', $scope.user).success(function(data) {
            if(data.state == 'success'){
                $rootScope.authenticated = true;
                sharedProperties.setUsername(data.user.username);
                sharedProperties.setPassword(data.user.password);
                $location.path('/');
            }
            else {
                $scope.error_message = data.message;
            }
        });
    };
   
    $scope.register = function(){
        if($scope.user.password === $scope.user.verifyPassword){
            $http.post('/auth/signup', $scope.user).success(function(data){
                if(data.state == 'success'){
                    $rootScope.authenticated = true;
                    sharedProperties.setUsername(data.user.username);
                    $location.path('/');
                }
                else{
                    $scope.error_message = data.message;
                }
            });
        } else{
            $scope.user.password = "";
            $scope.user.verifyPassword = "";
            $scope.error_message = 'Passwords do not match';
        }
    };
    
});

