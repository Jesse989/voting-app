var app = angular.module('app', ["chart.js",'ngRoute', 'ngResource']);

app.factory('postService', function($resource){
    return $resource('/api/polls/:id', null,
    {
        'update': { method:'PUT' }
    });
});

app.service('sharedProperties', function () {
    var current_user = "";

    return {
        getUsername: function () {
            return current_user;
        },
        setUsername: function(value) {
            current_user = value;
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
    $scope.delete = function($event) {
        console.log($event.target.id)
        postService.remove({id:$event.target.id});
        $scope.polls = postService.query();
    };
}]);


app.controller("chartController", ['sharedProperties', 'postService', '$scope', '$timeout', '$location', '$rootScope', function (sharedProperties, postService, $scope, $timeout, $location, $rootScope) {
    $scope.polls = postService.query();
    $scope.choice = "";
    $scope.error_message = "";
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
    

    $scope.createPoll = function(){
        $scope.newPoll.created_by = sharedProperties.getUsername(); //TODO change to rootscope current user
        $scope.newPoll.created_at = Date.now();
        if($scope.newPoll.choices.length < 2){
            alert('Enter at least two choices!');
        } else {
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
            alert('Poll created succesfully');
        }
    };

    $scope.viewPoll = function($event) {
        
        
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
            $scope.labels.push($scope.choice);
            $scope.data.push(1);
            $scope.update();
            $scope.choic = "";
        } else {
            alert("You already added or voted!");
            $scope.choice = "";
        }
    };
  
    $scope.onClick = function (points) {
        if($scope.canVote()){
            $scope.data[points[0]._index] += 1;
            $scope.update();
        } else {
            alert("You have already voted!");
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
        $location.path('/');
    };
    
    $scope.login = function(){
        $http.post('/auth/login', $scope.user).success(function(data) {
            if(data.state == 'success'){
                $rootScope.authenticated = true;
                sharedProperties.setUsername(data.user.username);
                $location.path('/');
            }
            else {
                $scope.error_message = data.message;
            }
        });
    };
   
    $scope.register = function(){
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
    };
    
});

