'use strict'
var AWS = require('aws-sdk'),
    fs = require('fs'),
    csv = require('fast-csv'),
    awsCredentialsPath = './aws.credentials.json',
    http = require('http'),
    zlib = require('zlib'),
    stream = require('stream'),
    filter = require("stream-filter"),
    through = require("through"),
    util = require('util');

//solution_id,source_id,random_index,ref_epoch,ra,ra_error,dec,dec_error,parallax,parallax_error,pmra,pmra_error,pmdec,pmdec_error,ra_dec_corr,ra_parallax_corr,ra_pmra_corr,ra_pmdec_corr,dec_parallax_corr,dec_pmra_corr,dec_pmdec_corr,parallax_pmra_corr,parallax_pmdec_corr,pmra_pmdec_corr,astrometric_n_obs_al,astrometric_n_obs_ac,astrometric_n_good_obs_al,astrometric_n_good_obs_ac,astrometric_n_bad_obs_al,astrometric_n_bad_obs_ac,astrometric_delta_q,astrometric_excess_noise,astrometric_excess_noise_sig,astrometric_primary_flag,astrometric_relegation_factor,astrometric_weight_al,astrometric_weight_ac,astrometric_priors_used,matched_observations,duplicated_source,scan_direction_strength_k1,scan_direction_strength_k2,scan_direction_strength_k3,scan_direction_strength_k4,scan_direction_mean_k1,scan_direction_mean_k2,scan_direction_mean_k3,scan_direction_mean_k4,phot_g_n_obs,phot_g_mean_flux,phot_g_mean_flux_error,phot_g_mean_mag,phot_variable_flag,l,b,ecl_lon,ecl_lat

// Load credentials from local json file
AWS.config.loadFromPath(awsCredentialsPath);

function processFile(filename, callback) {

  var s3 = new AWS.S3();

  var params = {
      Bucket: 'flimshaw.gaia',
      Key: filename
    };

  var headers = false;
  var fields = ['ra','dec','ra_error','dec_error','parallax','parallax_error']

  var validRows = []

  var s3Stream = require('s3-upload-stream')(new AWS.S3());

  var upload = s3Stream.upload({
    "Bucket": "flimshaw.gaia.processed",
    "Key": filename + '.processed'
  });

  upload.on('uploaded', function (details) {
    console.log(details);
    callback();
  });

  // filters out stars from the stream that are not valid
  var starValidator = filter.obj(function(data) {
      if(!headers) {
        headers = data;
        return false;
      }
      // check for valid parallax measurement
      if(data[headers.indexOf('parallax')].length > 0) {
        return true;
      }
      return false;
  })

  var toCsv = through(function write(data) {
    this.emit('data', data.join(',') + '\n')
  });

  s3.getObject(params).createReadStream()
    .pipe(zlib.createGunzip())
    .pipe(csv())
    .pipe(starValidator)
    .pipe(toCsv)
    .pipe(upload)
}

module.exports = processFile;
