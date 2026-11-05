import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { originalsRoleImage } from '../src/utils/originalsRoleImages.js';

test('specific vocal backgrounds take precedence over the general male-vocal photo', () => {
  for (const role of ['Vocal', 'Male vocalist', 'Lead Male Vocals', 'Singer']) assert.equal(originalsRoleImage(role), 'vocal');
  for (const role of ['Female Vocalist', 'Lead female vocals']) assert.equal(originalsRoleImage(role), 'female-vocal');
  for (const role of ['Backing vocals', 'Female backing vocals', 'Background singer', 'BVs']) assert.equal(originalsRoleImage(role), 'backing-vocals');
});
test('instrument variants, production roles and custom roles use the appropriate supplied images', () => {
  for (const [role, image] of [['Bass guitar','bass'],['Acoustic Guitar','guitar'],['Piano','keys'],['Keyboard','keys'],['Acoustic Drums','drums'],['Percussion','drums'],['Tenor saxophone','saxophone'],['Trumpet','trumpet'],['Mixing Engineer','mixing'],['Mastering Engineer','mastering'],['Click track','click-track'],['Click','click-track'],['CLICK_TRACK','click-track'],['Metronome','click-track'],['Typewriter Sound effect','other'],['Bass clarinet','other'],['Masterful strings','other'],[null,'other']]) assert.equal(originalsRoleImage(role), image, String(role));
});
test('each role family has both responsive image sizes in the site assets', () => {
  for (const image of ['click-track','drums','keys','guitar','bass','vocal','female-vocal','saxophone','trumpet','backing-vocals','mixing','mastering','other']) {
    for (const width of [480,960]) assert.ok(existsSync(new URL(`../public/originals/role-backgrounds/${image}-${width}.webp`, import.meta.url)), `${image} ${width}`);
  }
});
