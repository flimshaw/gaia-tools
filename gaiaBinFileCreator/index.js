'use strict';
var fs = require('fs')
  , csv = require('fast-csv')
  , sqlite3 = require('sqlite3').verbose()
  , db = new sqlite3.Database('../data/gaia.sqlite');

var fields = ['ra', 'dec', 'parallax', 'phot_g_mean_mag'];
var headers = ['solution_id','source_id','random_index','ref_epoch','ra','ra_error','dec','dec_error','parallax','parallax_error','pmra','pmra_error','pmdec','pmdec_error','ra_dec_corr','ra_parallax_corr','ra_pmra_corr','ra_pmdec_corr','dec_parallax_corr','dec_pmra_corr','dec_pmdec_corr','parallax_pmra_corr','parallax_pmdec_corr','pmra_pmdec_corr','astrometric_n_obs_al','astrometric_n_obs_ac','astrometric_n_good_obs_al','astrometric_n_good_obs_ac','astrometric_n_bad_obs_al','astrometric_n_bad_obs_ac','astrometric_delta_q','astrometric_excess_noise','astrometric_excess_noise_sig','astrometric_primary_flag','astrometric_relegation_factor','astrometric_weight_al','astrometric_weight_ac','astrometric_priors_used','matched_observations','duplicated_source','scan_direction_strength_k1','scan_direction_strength_k2','scan_direction_strength_k3','scan_direction_strength_k4','scan_direction_mean_k1','scan_direction_mean_k2','scan_direction_mean_k3','scan_direction_mean_k4','phot_g_n_obs','phot_g_mean_flux','phot_g_mean_flux_error','phot_g_mean_mag','phot_variable_flag','l','b','ecl_lon','ecl_lat'];

var valueCount = 0;
var starCount = 0;
var minAbs = 0;
var maxAbs = 0;

const DEG2RAD = Math.PI / 180;
var wstream = fs.createWriteStream('stars.bin');
db.each(`SELECT ${fields.join(',')} from stars where parallax > 0`, function(err, row) {

  // print some progress alerts out every 10,000 rows
  if((valueCount)%10000 === 0) {
    console.log(`${valueCount} values written...`);
  }

  // calulate distance from parallax (in mas)
  let dist = 1 / (row.parallax * 0.001);

  // calculate cartesian coordinate using ra/dec and distance
  let x = Math.cos(row.ra * DEG2RAD) * Math.cos(row.dec * DEG2RAD) * dist; // x coord + dist
  let y = Math.sin(row.ra * DEG2RAD) * Math.cos(row.dec * DEG2RAD) * dist; // y coord + dist
  let z = Math.sin(row.dec * DEG2RAD) * dist; // z coord + dist

  // create a packet of float32s from our calculated values
  var a = new Float32Array(3);
  [x,y,z].map( (field,i) => {
    a[i] = field;
    valueCount++;
  })

  // cast the packet of three floats back into an array of simple bytes
  let byteArray = new Uint8Array(a.buffer, 0, Float32Array.BYTES_PER_ELEMENT*3);
  wstream.write(new Buffer(a));
  starCount++;
}, function() {
  console.log(`Binary dump complete, ${valueCount} pixels written for ${starCount} stars.`);
  wstream.end();
});
