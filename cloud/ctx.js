'use strict';
/* global Parse */

var CTXKWh = Parse.Object.extend('CTXKWh');

Parse.Cloud.beforeSave('CTXData', function (request, response) {
  if (!(request.object.existed())) {
    if (parseFloat(request.object.get('data'))>=0) {
      var newData = request.object.get('data');
      var grpId = request.object.get('groupId');
      console.log(newData);
      var query = new Parse.Query(CTXKWh);
      query.equalTo('groupId', grpId);
      query.find()
      .then(function (results) {
        if (results.length === 0) {
          new CTXKWh().save({
            groupId: grpId,
            totalKWh: newData
          });
        }
        else {
          var totalkwh = (parseFloat(newData) + parseFloat(results[0].get('totalKWh'))).toFixed(4).toString();
          return results[0].save({
            totalKWh: totalkwh
          });
        }
      })
      .then(
      function () { response.success(request.object.set('saved', true)); },
      function (error) { response.error(error); }
      );
    }
    else {
      response.error(error);
    }
  }
});
