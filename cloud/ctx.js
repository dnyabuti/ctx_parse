'use strict';
/* global Parse */

var CTXKWh = Parse.Object.extend('CTXKWh');
var AccData = Parse.Object.extend('AccData');

Parse.Cloud.beforeSave('CTXData', function (request, response) {
  if (!(request.object.existed())) {
    if (parseFloat(request.object.get('data')) >= 0) {
      var newData = request.object.get('data');
      var grpId = request.object.get('groupId');

      var query = new Parse.Query(CTXKWh);
      var accQuery = new Parse.Query(AccData);

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
        .then(function () {

          var nDate = getTime(0);
          var nHour = getTime(1);

          accQuery.equalTo('date', nDate);
          accQuery.find()
            .then(function (results) {
              if (results.length === 0) {
                new AccData().save(null, {
                  success: function (res) {
                    res.set('date', nDate);
                    res.set(`${nHour}`, newData);
                    res.save();
                  }
                });
              }
              else {
                if (results[0].get(nHour)) {
                  var newAcc = (parseFloat(newData) + parseFloat(results[0].get(nHour))).toFixed(4).toString();
                  return results[0].save(null, {
                    success: function (res) {
                      res.set(`${nHour}`, newAcc);
                      res.save();
                    }
                  });
                }
                else {
                  return results[0].save(null, {
                    success: function (res) {
                      res.set(`${nHour}`, newData);
                      res.save();
                    }
                  });
                }
              }
            });
        })
        .then(
        function () { response.success(request.object.set('saved', true)); },
        function (error) { response.error(error); }
        );
    }
  }
});

function getTime(_type) {
  var date = new Date(new Date().getTime() - (3 * 60 * 60 * 1000));
  var lDate = date.toLocaleDateString();
  var hours = date.getHours();
  if (_type === 0) {
    return lDate;
  }
  else {
    switch (hours) {
      case 0:
        return 'h2';
      case 1:
        return 'h2';
      case 2:
        return 'h4';
      case 3:
        return 'h4';
      case 4:
        return 'h6';
      case 5:
        return 'h6';
      case 6:
        return 'h8';
      case 7:
        return 'h8';
      case 8:
        return 'h10';
      case 9:
        return 'h10';
      case 10:
        return 'h12';
      case 11:
        return 'h12';
      case 12:
        return 'h14';
      case 13:
        return 'h14';
      case 14:
        return 'h16';
      case 15:
        return 'h16';
      case 16:
        return 'h18';
      case 17:
        return 'h18';
      case 18:
        return 'h20';
      case 19:
        return 'h20';
      case 20:
        return 'h22';
      case 21:
        return 'h22';
      case 22:
        return 'h0';
      case 23:
        return 'h0';
      default:
        return `h${hours}`;
    }
  }
}
