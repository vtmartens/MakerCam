"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/clipper-lib/clipper.js
  var require_clipper = __commonJS({
    "node_modules/clipper-lib/clipper.js"(exports, module) {
      (function() {
        "use strict";
        var ClipperLib2 = {};
        ClipperLib2.version = "6.4.2.2";
        ClipperLib2.use_lines = true;
        ClipperLib2.use_xyz = false;
        var isNode = false;
        if (typeof module !== "undefined" && module.exports) {
          module.exports = ClipperLib2;
          isNode = true;
        } else {
          if (typeof define === "function" && define.amd) {
            define(ClipperLib2);
          }
          if (typeof document !== "undefined") window.ClipperLib = ClipperLib2;
          else self["ClipperLib"] = ClipperLib2;
        }
        var navigator_appName;
        if (!isNode) {
          var nav = navigator.userAgent.toString().toLowerCase();
          navigator_appName = navigator.appName;
        } else {
          var nav = "chrome";
          navigator_appName = "Netscape";
        }
        var browser = {};
        if (nav.indexOf("chrome") != -1 && nav.indexOf("chromium") == -1) browser.chrome = 1;
        else browser.chrome = 0;
        if (nav.indexOf("chromium") != -1) browser.chromium = 1;
        else browser.chromium = 0;
        if (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1 && nav.indexOf("chromium") == -1) browser.safari = 1;
        else browser.safari = 0;
        if (nav.indexOf("firefox") != -1) browser.firefox = 1;
        else browser.firefox = 0;
        if (nav.indexOf("firefox/17") != -1) browser.firefox17 = 1;
        else browser.firefox17 = 0;
        if (nav.indexOf("firefox/15") != -1) browser.firefox15 = 1;
        else browser.firefox15 = 0;
        if (nav.indexOf("firefox/3") != -1) browser.firefox3 = 1;
        else browser.firefox3 = 0;
        if (nav.indexOf("opera") != -1) browser.opera = 1;
        else browser.opera = 0;
        if (nav.indexOf("msie 10") != -1) browser.msie10 = 1;
        else browser.msie10 = 0;
        if (nav.indexOf("msie 9") != -1) browser.msie9 = 1;
        else browser.msie9 = 0;
        if (nav.indexOf("msie 8") != -1) browser.msie8 = 1;
        else browser.msie8 = 0;
        if (nav.indexOf("msie 7") != -1) browser.msie7 = 1;
        else browser.msie7 = 0;
        if (nav.indexOf("msie ") != -1) browser.msie = 1;
        else browser.msie = 0;
        ClipperLib2.biginteger_used = null;
        var dbits;
        var canary = 244837814094590;
        var j_lm = (canary & 16777215) == 15715070;
        function BigInteger(a, b, c) {
          ClipperLib2.biginteger_used = 1;
          if (a != null)
            if ("number" == typeof a && "undefined" == typeof b) this.fromInt(a);
            else if ("number" == typeof a) this.fromNumber(a, b, c);
            else if (b == null && "string" != typeof a) this.fromString(a, 256);
            else this.fromString(a, b);
        }
        function nbi() {
          return new BigInteger(null, void 0, void 0);
        }
        function am1(i, x, w, j, c, n) {
          while (--n >= 0) {
            var v = x * this[i++] + w[j] + c;
            c = Math.floor(v / 67108864);
            w[j++] = v & 67108863;
          }
          return c;
        }
        function am2(i, x, w, j, c, n) {
          var xl = x & 32767, xh = x >> 15;
          while (--n >= 0) {
            var l = this[i] & 32767;
            var h = this[i++] >> 15;
            var m = xh * l + h * xl;
            l = xl * l + ((m & 32767) << 15) + w[j] + (c & 1073741823);
            c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
            w[j++] = l & 1073741823;
          }
          return c;
        }
        function am3(i, x, w, j, c, n) {
          var xl = x & 16383, xh = x >> 14;
          while (--n >= 0) {
            var l = this[i] & 16383;
            var h = this[i++] >> 14;
            var m = xh * l + h * xl;
            l = xl * l + ((m & 16383) << 14) + w[j] + c;
            c = (l >> 28) + (m >> 14) + xh * h;
            w[j++] = l & 268435455;
          }
          return c;
        }
        if (j_lm && navigator_appName == "Microsoft Internet Explorer") {
          BigInteger.prototype.am = am2;
          dbits = 30;
        } else if (j_lm && navigator_appName != "Netscape") {
          BigInteger.prototype.am = am1;
          dbits = 26;
        } else {
          BigInteger.prototype.am = am3;
          dbits = 28;
        }
        BigInteger.prototype.DB = dbits;
        BigInteger.prototype.DM = (1 << dbits) - 1;
        BigInteger.prototype.DV = 1 << dbits;
        var BI_FP = 52;
        BigInteger.prototype.FV = Math.pow(2, BI_FP);
        BigInteger.prototype.F1 = BI_FP - dbits;
        BigInteger.prototype.F2 = 2 * dbits - BI_FP;
        var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
        var BI_RC = new Array();
        var rr, vv;
        rr = "0".charCodeAt(0);
        for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
        rr = "a".charCodeAt(0);
        for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
        rr = "A".charCodeAt(0);
        for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
        function int2char(n) {
          return BI_RM.charAt(n);
        }
        function intAt(s, i) {
          var c = BI_RC[s.charCodeAt(i)];
          return c == null ? -1 : c;
        }
        function bnpCopyTo(r) {
          for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
          r.t = this.t;
          r.s = this.s;
        }
        function bnpFromInt(x) {
          this.t = 1;
          this.s = x < 0 ? -1 : 0;
          if (x > 0) this[0] = x;
          else if (x < -1) this[0] = x + this.DV;
          else this.t = 0;
        }
        function nbv(i) {
          var r = nbi();
          r.fromInt(i);
          return r;
        }
        function bnpFromString(s, b) {
          var k;
          if (b == 16) k = 4;
          else if (b == 8) k = 3;
          else if (b == 256) k = 8;
          else if (b == 2) k = 1;
          else if (b == 32) k = 5;
          else if (b == 4) k = 2;
          else {
            this.fromRadix(s, b);
            return;
          }
          this.t = 0;
          this.s = 0;
          var i = s.length, mi = false, sh = 0;
          while (--i >= 0) {
            var x = k == 8 ? s[i] & 255 : intAt(s, i);
            if (x < 0) {
              if (s.charAt(i) == "-") mi = true;
              continue;
            }
            mi = false;
            if (sh == 0)
              this[this.t++] = x;
            else if (sh + k > this.DB) {
              this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
              this[this.t++] = x >> this.DB - sh;
            } else
              this[this.t - 1] |= x << sh;
            sh += k;
            if (sh >= this.DB) sh -= this.DB;
          }
          if (k == 8 && (s[0] & 128) != 0) {
            this.s = -1;
            if (sh > 0) this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
          }
          this.clamp();
          if (mi) BigInteger.ZERO.subTo(this, this);
        }
        function bnpClamp() {
          var c = this.s & this.DM;
          while (this.t > 0 && this[this.t - 1] == c) --this.t;
        }
        function bnToString(b) {
          if (this.s < 0) return "-" + this.negate().toString(b);
          var k;
          if (b == 16) k = 4;
          else if (b == 8) k = 3;
          else if (b == 2) k = 1;
          else if (b == 32) k = 5;
          else if (b == 4) k = 2;
          else return this.toRadix(b);
          var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
          var p = this.DB - i * this.DB % k;
          if (i-- > 0) {
            if (p < this.DB && (d = this[i] >> p) > 0) {
              m = true;
              r = int2char(d);
            }
            while (i >= 0) {
              if (p < k) {
                d = (this[i] & (1 << p) - 1) << k - p;
                d |= this[--i] >> (p += this.DB - k);
              } else {
                d = this[i] >> (p -= k) & km;
                if (p <= 0) {
                  p += this.DB;
                  --i;
                }
              }
              if (d > 0) m = true;
              if (m) r += int2char(d);
            }
          }
          return m ? r : "0";
        }
        function bnNegate() {
          var r = nbi();
          BigInteger.ZERO.subTo(this, r);
          return r;
        }
        function bnAbs() {
          return this.s < 0 ? this.negate() : this;
        }
        function bnCompareTo(a) {
          var r = this.s - a.s;
          if (r != 0) return r;
          var i = this.t;
          r = i - a.t;
          if (r != 0) return this.s < 0 ? -r : r;
          while (--i >= 0)
            if ((r = this[i] - a[i]) != 0) return r;
          return 0;
        }
        function nbits(x) {
          var r = 1, t;
          if ((t = x >>> 16) != 0) {
            x = t;
            r += 16;
          }
          if ((t = x >> 8) != 0) {
            x = t;
            r += 8;
          }
          if ((t = x >> 4) != 0) {
            x = t;
            r += 4;
          }
          if ((t = x >> 2) != 0) {
            x = t;
            r += 2;
          }
          if ((t = x >> 1) != 0) {
            x = t;
            r += 1;
          }
          return r;
        }
        function bnBitLength() {
          if (this.t <= 0) return 0;
          return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
        }
        function bnpDLShiftTo(n, r) {
          var i;
          for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
          for (i = n - 1; i >= 0; --i) r[i] = 0;
          r.t = this.t + n;
          r.s = this.s;
        }
        function bnpDRShiftTo(n, r) {
          for (var i = n; i < this.t; ++i) r[i - n] = this[i];
          r.t = Math.max(this.t - n, 0);
          r.s = this.s;
        }
        function bnpLShiftTo(n, r) {
          var bs = n % this.DB;
          var cbs = this.DB - bs;
          var bm = (1 << cbs) - 1;
          var ds = Math.floor(n / this.DB), c = this.s << bs & this.DM, i;
          for (i = this.t - 1; i >= 0; --i) {
            r[i + ds + 1] = this[i] >> cbs | c;
            c = (this[i] & bm) << bs;
          }
          for (i = ds - 1; i >= 0; --i) r[i] = 0;
          r[ds] = c;
          r.t = this.t + ds + 1;
          r.s = this.s;
          r.clamp();
        }
        function bnpRShiftTo(n, r) {
          r.s = this.s;
          var ds = Math.floor(n / this.DB);
          if (ds >= this.t) {
            r.t = 0;
            return;
          }
          var bs = n % this.DB;
          var cbs = this.DB - bs;
          var bm = (1 << bs) - 1;
          r[0] = this[ds] >> bs;
          for (var i = ds + 1; i < this.t; ++i) {
            r[i - ds - 1] |= (this[i] & bm) << cbs;
            r[i - ds] = this[i] >> bs;
          }
          if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
          r.t = this.t - ds;
          r.clamp();
        }
        function bnpSubTo(a, r) {
          var i = 0, c = 0, m = Math.min(a.t, this.t);
          while (i < m) {
            c += this[i] - a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
          }
          if (a.t < this.t) {
            c -= a.s;
            while (i < this.t) {
              c += this[i];
              r[i++] = c & this.DM;
              c >>= this.DB;
            }
            c += this.s;
          } else {
            c += this.s;
            while (i < a.t) {
              c -= a[i];
              r[i++] = c & this.DM;
              c >>= this.DB;
            }
            c -= a.s;
          }
          r.s = c < 0 ? -1 : 0;
          if (c < -1) r[i++] = this.DV + c;
          else if (c > 0) r[i++] = c;
          r.t = i;
          r.clamp();
        }
        function bnpMultiplyTo(a, r) {
          var x = this.abs(), y = a.abs();
          var i = x.t;
          r.t = i + y.t;
          while (--i >= 0) r[i] = 0;
          for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
          r.s = 0;
          r.clamp();
          if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
        }
        function bnpSquareTo(r) {
          var x = this.abs();
          var i = r.t = 2 * x.t;
          while (--i >= 0) r[i] = 0;
          for (i = 0; i < x.t - 1; ++i) {
            var c = x.am(i, x[i], r, 2 * i, 0, 1);
            if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
              r[i + x.t] -= x.DV;
              r[i + x.t + 1] = 1;
            }
          }
          if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
          r.s = 0;
          r.clamp();
        }
        function bnpDivRemTo(m, q, r) {
          var pm = m.abs();
          if (pm.t <= 0) return;
          var pt3 = this.abs();
          if (pt3.t < pm.t) {
            if (q != null) q.fromInt(0);
            if (r != null) this.copyTo(r);
            return;
          }
          if (r == null) r = nbi();
          var y = nbi(), ts = this.s, ms = m.s;
          var nsh = this.DB - nbits(pm[pm.t - 1]);
          if (nsh > 0) {
            pm.lShiftTo(nsh, y);
            pt3.lShiftTo(nsh, r);
          } else {
            pm.copyTo(y);
            pt3.copyTo(r);
          }
          var ys = y.t;
          var y0 = y[ys - 1];
          if (y0 == 0) return;
          var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
          var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
          var i = r.t, j = i - ys, t = q == null ? nbi() : q;
          y.dlShiftTo(j, t);
          if (r.compareTo(t) >= 0) {
            r[r.t++] = 1;
            r.subTo(t, r);
          }
          BigInteger.ONE.dlShiftTo(ys, t);
          t.subTo(y, y);
          while (y.t < ys) y[y.t++] = 0;
          while (--j >= 0) {
            var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
            if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
              y.dlShiftTo(j, t);
              r.subTo(t, r);
              while (r[i] < --qd) r.subTo(t, r);
            }
          }
          if (q != null) {
            r.drShiftTo(ys, q);
            if (ts != ms) BigInteger.ZERO.subTo(q, q);
          }
          r.t = ys;
          r.clamp();
          if (nsh > 0) r.rShiftTo(nsh, r);
          if (ts < 0) BigInteger.ZERO.subTo(r, r);
        }
        function bnMod(a) {
          var r = nbi();
          this.abs().divRemTo(a, null, r);
          if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
          return r;
        }
        function Classic(m) {
          this.m = m;
        }
        function cConvert(x) {
          if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
          else return x;
        }
        function cRevert(x) {
          return x;
        }
        function cReduce(x) {
          x.divRemTo(this.m, null, x);
        }
        function cMulTo(x, y, r) {
          x.multiplyTo(y, r);
          this.reduce(r);
        }
        function cSqrTo(x, r) {
          x.squareTo(r);
          this.reduce(r);
        }
        Classic.prototype.convert = cConvert;
        Classic.prototype.revert = cRevert;
        Classic.prototype.reduce = cReduce;
        Classic.prototype.mulTo = cMulTo;
        Classic.prototype.sqrTo = cSqrTo;
        function bnpInvDigit() {
          if (this.t < 1) return 0;
          var x = this[0];
          if ((x & 1) == 0) return 0;
          var y = x & 3;
          y = y * (2 - (x & 15) * y) & 15;
          y = y * (2 - (x & 255) * y) & 255;
          y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
          y = y * (2 - x * y % this.DV) % this.DV;
          return y > 0 ? this.DV - y : -y;
        }
        function Montgomery(m) {
          this.m = m;
          this.mp = m.invDigit();
          this.mpl = this.mp & 32767;
          this.mph = this.mp >> 15;
          this.um = (1 << m.DB - 15) - 1;
          this.mt2 = 2 * m.t;
        }
        function montConvert(x) {
          var r = nbi();
          x.abs().dlShiftTo(this.m.t, r);
          r.divRemTo(this.m, null, r);
          if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
          return r;
        }
        function montRevert(x) {
          var r = nbi();
          x.copyTo(r);
          this.reduce(r);
          return r;
        }
        function montReduce(x) {
          while (x.t <= this.mt2)
            x[x.t++] = 0;
          for (var i = 0; i < this.m.t; ++i) {
            var j = x[i] & 32767;
            var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
            j = i + this.m.t;
            x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
            while (x[j] >= x.DV) {
              x[j] -= x.DV;
              x[++j]++;
            }
          }
          x.clamp();
          x.drShiftTo(this.m.t, x);
          if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
        }
        function montSqrTo(x, r) {
          x.squareTo(r);
          this.reduce(r);
        }
        function montMulTo(x, y, r) {
          x.multiplyTo(y, r);
          this.reduce(r);
        }
        Montgomery.prototype.convert = montConvert;
        Montgomery.prototype.revert = montRevert;
        Montgomery.prototype.reduce = montReduce;
        Montgomery.prototype.mulTo = montMulTo;
        Montgomery.prototype.sqrTo = montSqrTo;
        function bnpIsEven() {
          return (this.t > 0 ? this[0] & 1 : this.s) == 0;
        }
        function bnpExp(e, z) {
          if (e > 4294967295 || e < 1) return BigInteger.ONE;
          var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
          g.copyTo(r);
          while (--i >= 0) {
            z.sqrTo(r, r2);
            if ((e & 1 << i) > 0) z.mulTo(r2, g, r);
            else {
              var t = r;
              r = r2;
              r2 = t;
            }
          }
          return z.revert(r);
        }
        function bnModPowInt(e, m) {
          var z;
          if (e < 256 || m.isEven()) z = new Classic(m);
          else z = new Montgomery(m);
          return this.exp(e, z);
        }
        BigInteger.prototype.copyTo = bnpCopyTo;
        BigInteger.prototype.fromInt = bnpFromInt;
        BigInteger.prototype.fromString = bnpFromString;
        BigInteger.prototype.clamp = bnpClamp;
        BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
        BigInteger.prototype.drShiftTo = bnpDRShiftTo;
        BigInteger.prototype.lShiftTo = bnpLShiftTo;
        BigInteger.prototype.rShiftTo = bnpRShiftTo;
        BigInteger.prototype.subTo = bnpSubTo;
        BigInteger.prototype.multiplyTo = bnpMultiplyTo;
        BigInteger.prototype.squareTo = bnpSquareTo;
        BigInteger.prototype.divRemTo = bnpDivRemTo;
        BigInteger.prototype.invDigit = bnpInvDigit;
        BigInteger.prototype.isEven = bnpIsEven;
        BigInteger.prototype.exp = bnpExp;
        BigInteger.prototype.toString = bnToString;
        BigInteger.prototype.negate = bnNegate;
        BigInteger.prototype.abs = bnAbs;
        BigInteger.prototype.compareTo = bnCompareTo;
        BigInteger.prototype.bitLength = bnBitLength;
        BigInteger.prototype.mod = bnMod;
        BigInteger.prototype.modPowInt = bnModPowInt;
        BigInteger.ZERO = nbv(0);
        BigInteger.ONE = nbv(1);
        function bnClone() {
          var r = nbi();
          this.copyTo(r);
          return r;
        }
        function bnIntValue() {
          if (this.s < 0) {
            if (this.t == 1) return this[0] - this.DV;
            else if (this.t == 0) return -1;
          } else if (this.t == 1) return this[0];
          else if (this.t == 0) return 0;
          return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
        }
        function bnByteValue() {
          return this.t == 0 ? this.s : this[0] << 24 >> 24;
        }
        function bnShortValue() {
          return this.t == 0 ? this.s : this[0] << 16 >> 16;
        }
        function bnpChunkSize(r) {
          return Math.floor(Math.LN2 * this.DB / Math.log(r));
        }
        function bnSigNum() {
          if (this.s < 0) return -1;
          else if (this.t <= 0 || this.t == 1 && this[0] <= 0) return 0;
          else return 1;
        }
        function bnpToRadix(b) {
          if (b == null) b = 10;
          if (this.signum() == 0 || b < 2 || b > 36) return "0";
          var cs = this.chunkSize(b);
          var a = Math.pow(b, cs);
          var d = nbv(a), y = nbi(), z = nbi(), r = "";
          this.divRemTo(d, y, z);
          while (y.signum() > 0) {
            r = (a + z.intValue()).toString(b).substr(1) + r;
            y.divRemTo(d, y, z);
          }
          return z.intValue().toString(b) + r;
        }
        function bnpFromRadix(s, b) {
          this.fromInt(0);
          if (b == null) b = 10;
          var cs = this.chunkSize(b);
          var d = Math.pow(b, cs), mi = false, j = 0, w = 0;
          for (var i = 0; i < s.length; ++i) {
            var x = intAt(s, i);
            if (x < 0) {
              if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
              continue;
            }
            w = b * w + x;
            if (++j >= cs) {
              this.dMultiply(d);
              this.dAddOffset(w, 0);
              j = 0;
              w = 0;
            }
          }
          if (j > 0) {
            this.dMultiply(Math.pow(b, j));
            this.dAddOffset(w, 0);
          }
          if (mi) BigInteger.ZERO.subTo(this, this);
        }
        function bnpFromNumber(a, b, c) {
          if ("number" == typeof b) {
            if (a < 2) this.fromInt(1);
            else {
              this.fromNumber(a, c);
              if (!this.testBit(a - 1))
                this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
              if (this.isEven()) this.dAddOffset(1, 0);
              while (!this.isProbablePrime(b)) {
                this.dAddOffset(2, 0);
                if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
              }
            }
          } else {
            var x = new Array(), t = a & 7;
            x.length = (a >> 3) + 1;
            b.nextBytes(x);
            if (t > 0) x[0] &= (1 << t) - 1;
            else x[0] = 0;
            this.fromString(x, 256);
          }
        }
        function bnToByteArray() {
          var i = this.t, r = new Array();
          r[0] = this.s;
          var p = this.DB - i * this.DB % 8, d, k = 0;
          if (i-- > 0) {
            if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
              r[k++] = d | this.s << this.DB - p;
            while (i >= 0) {
              if (p < 8) {
                d = (this[i] & (1 << p) - 1) << 8 - p;
                d |= this[--i] >> (p += this.DB - 8);
              } else {
                d = this[i] >> (p -= 8) & 255;
                if (p <= 0) {
                  p += this.DB;
                  --i;
                }
              }
              if ((d & 128) != 0) d |= -256;
              if (k == 0 && (this.s & 128) != (d & 128)) ++k;
              if (k > 0 || d != this.s) r[k++] = d;
            }
          }
          return r;
        }
        function bnEquals(a) {
          return this.compareTo(a) == 0;
        }
        function bnMin(a) {
          return this.compareTo(a) < 0 ? this : a;
        }
        function bnMax(a) {
          return this.compareTo(a) > 0 ? this : a;
        }
        function bnpBitwiseTo(a, op, r) {
          var i, f, m = Math.min(a.t, this.t);
          for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
          if (a.t < this.t) {
            f = a.s & this.DM;
            for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
            r.t = this.t;
          } else {
            f = this.s & this.DM;
            for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
            r.t = a.t;
          }
          r.s = op(this.s, a.s);
          r.clamp();
        }
        function op_and(x, y) {
          return x & y;
        }
        function bnAnd(a) {
          var r = nbi();
          this.bitwiseTo(a, op_and, r);
          return r;
        }
        function op_or(x, y) {
          return x | y;
        }
        function bnOr(a) {
          var r = nbi();
          this.bitwiseTo(a, op_or, r);
          return r;
        }
        function op_xor(x, y) {
          return x ^ y;
        }
        function bnXor(a) {
          var r = nbi();
          this.bitwiseTo(a, op_xor, r);
          return r;
        }
        function op_andnot(x, y) {
          return x & ~y;
        }
        function bnAndNot(a) {
          var r = nbi();
          this.bitwiseTo(a, op_andnot, r);
          return r;
        }
        function bnNot() {
          var r = nbi();
          for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
          r.t = this.t;
          r.s = ~this.s;
          return r;
        }
        function bnShiftLeft(n) {
          var r = nbi();
          if (n < 0) this.rShiftTo(-n, r);
          else this.lShiftTo(n, r);
          return r;
        }
        function bnShiftRight(n) {
          var r = nbi();
          if (n < 0) this.lShiftTo(-n, r);
          else this.rShiftTo(n, r);
          return r;
        }
        function lbit(x) {
          if (x == 0) return -1;
          var r = 0;
          if ((x & 65535) == 0) {
            x >>= 16;
            r += 16;
          }
          if ((x & 255) == 0) {
            x >>= 8;
            r += 8;
          }
          if ((x & 15) == 0) {
            x >>= 4;
            r += 4;
          }
          if ((x & 3) == 0) {
            x >>= 2;
            r += 2;
          }
          if ((x & 1) == 0) ++r;
          return r;
        }
        function bnGetLowestSetBit() {
          for (var i = 0; i < this.t; ++i)
            if (this[i] != 0) return i * this.DB + lbit(this[i]);
          if (this.s < 0) return this.t * this.DB;
          return -1;
        }
        function cbit(x) {
          var r = 0;
          while (x != 0) {
            x &= x - 1;
            ++r;
          }
          return r;
        }
        function bnBitCount() {
          var r = 0, x = this.s & this.DM;
          for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
          return r;
        }
        function bnTestBit(n) {
          var j = Math.floor(n / this.DB);
          if (j >= this.t) return this.s != 0;
          return (this[j] & 1 << n % this.DB) != 0;
        }
        function bnpChangeBit(n, op) {
          var r = BigInteger.ONE.shiftLeft(n);
          this.bitwiseTo(r, op, r);
          return r;
        }
        function bnSetBit(n) {
          return this.changeBit(n, op_or);
        }
        function bnClearBit(n) {
          return this.changeBit(n, op_andnot);
        }
        function bnFlipBit(n) {
          return this.changeBit(n, op_xor);
        }
        function bnpAddTo(a, r) {
          var i = 0, c = 0, m = Math.min(a.t, this.t);
          while (i < m) {
            c += this[i] + a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
          }
          if (a.t < this.t) {
            c += a.s;
            while (i < this.t) {
              c += this[i];
              r[i++] = c & this.DM;
              c >>= this.DB;
            }
            c += this.s;
          } else {
            c += this.s;
            while (i < a.t) {
              c += a[i];
              r[i++] = c & this.DM;
              c >>= this.DB;
            }
            c += a.s;
          }
          r.s = c < 0 ? -1 : 0;
          if (c > 0) r[i++] = c;
          else if (c < -1) r[i++] = this.DV + c;
          r.t = i;
          r.clamp();
        }
        function bnAdd(a) {
          var r = nbi();
          this.addTo(a, r);
          return r;
        }
        function bnSubtract(a) {
          var r = nbi();
          this.subTo(a, r);
          return r;
        }
        function bnMultiply(a) {
          var r = nbi();
          this.multiplyTo(a, r);
          return r;
        }
        function bnSquare() {
          var r = nbi();
          this.squareTo(r);
          return r;
        }
        function bnDivide(a) {
          var r = nbi();
          this.divRemTo(a, r, null);
          return r;
        }
        function bnRemainder(a) {
          var r = nbi();
          this.divRemTo(a, null, r);
          return r;
        }
        function bnDivideAndRemainder(a) {
          var q = nbi(), r = nbi();
          this.divRemTo(a, q, r);
          return new Array(q, r);
        }
        function bnpDMultiply(n) {
          this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
          ++this.t;
          this.clamp();
        }
        function bnpDAddOffset(n, w) {
          if (n == 0) return;
          while (this.t <= w) this[this.t++] = 0;
          this[w] += n;
          while (this[w] >= this.DV) {
            this[w] -= this.DV;
            if (++w >= this.t) this[this.t++] = 0;
            ++this[w];
          }
        }
        function NullExp() {
        }
        function nNop(x) {
          return x;
        }
        function nMulTo(x, y, r) {
          x.multiplyTo(y, r);
        }
        function nSqrTo(x, r) {
          x.squareTo(r);
        }
        NullExp.prototype.convert = nNop;
        NullExp.prototype.revert = nNop;
        NullExp.prototype.mulTo = nMulTo;
        NullExp.prototype.sqrTo = nSqrTo;
        function bnPow(e) {
          return this.exp(e, new NullExp());
        }
        function bnpMultiplyLowerTo(a, n, r) {
          var i = Math.min(this.t + a.t, n);
          r.s = 0;
          r.t = i;
          while (i > 0) r[--i] = 0;
          var j;
          for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
          for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
          r.clamp();
        }
        function bnpMultiplyUpperTo(a, n, r) {
          --n;
          var i = r.t = this.t + a.t - n;
          r.s = 0;
          while (--i >= 0) r[i] = 0;
          for (i = Math.max(n - this.t, 0); i < a.t; ++i)
            r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
          r.clamp();
          r.drShiftTo(1, r);
        }
        function Barrett(m) {
          this.r2 = nbi();
          this.q3 = nbi();
          BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
          this.mu = this.r2.divide(m);
          this.m = m;
        }
        function barrettConvert(x) {
          if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
          else if (x.compareTo(this.m) < 0) return x;
          else {
            var r = nbi();
            x.copyTo(r);
            this.reduce(r);
            return r;
          }
        }
        function barrettRevert(x) {
          return x;
        }
        function barrettReduce(x) {
          x.drShiftTo(this.m.t - 1, this.r2);
          if (x.t > this.m.t + 1) {
            x.t = this.m.t + 1;
            x.clamp();
          }
          this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
          this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
          while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
          x.subTo(this.r2, x);
          while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
        }
        function barrettSqrTo(x, r) {
          x.squareTo(r);
          this.reduce(r);
        }
        function barrettMulTo(x, y, r) {
          x.multiplyTo(y, r);
          this.reduce(r);
        }
        Barrett.prototype.convert = barrettConvert;
        Barrett.prototype.revert = barrettRevert;
        Barrett.prototype.reduce = barrettReduce;
        Barrett.prototype.mulTo = barrettMulTo;
        Barrett.prototype.sqrTo = barrettSqrTo;
        function bnModPow(e, m) {
          var i = e.bitLength(), k, r = nbv(1), z;
          if (i <= 0) return r;
          else if (i < 18) k = 1;
          else if (i < 48) k = 3;
          else if (i < 144) k = 4;
          else if (i < 768) k = 5;
          else k = 6;
          if (i < 8)
            z = new Classic(m);
          else if (m.isEven())
            z = new Barrett(m);
          else
            z = new Montgomery(m);
          var g = new Array(), n = 3, k1 = k - 1, km = (1 << k) - 1;
          g[1] = z.convert(this);
          if (k > 1) {
            var g2 = nbi();
            z.sqrTo(g[1], g2);
            while (n <= km) {
              g[n] = nbi();
              z.mulTo(g2, g[n - 2], g[n]);
              n += 2;
            }
          }
          var j = e.t - 1, w, is1 = true, r2 = nbi(), t;
          i = nbits(e[j]) - 1;
          while (j >= 0) {
            if (i >= k1) w = e[j] >> i - k1 & km;
            else {
              w = (e[j] & (1 << i + 1) - 1) << k1 - i;
              if (j > 0) w |= e[j - 1] >> this.DB + i - k1;
            }
            n = k;
            while ((w & 1) == 0) {
              w >>= 1;
              --n;
            }
            if ((i -= n) < 0) {
              i += this.DB;
              --j;
            }
            if (is1) {
              g[w].copyTo(r);
              is1 = false;
            } else {
              while (n > 1) {
                z.sqrTo(r, r2);
                z.sqrTo(r2, r);
                n -= 2;
              }
              if (n > 0) z.sqrTo(r, r2);
              else {
                t = r;
                r = r2;
                r2 = t;
              }
              z.mulTo(r2, g[w], r);
            }
            while (j >= 0 && (e[j] & 1 << i) == 0) {
              z.sqrTo(r, r2);
              t = r;
              r = r2;
              r2 = t;
              if (--i < 0) {
                i = this.DB - 1;
                --j;
              }
            }
          }
          return z.revert(r);
        }
        function bnGCD(a) {
          var x = this.s < 0 ? this.negate() : this.clone();
          var y = a.s < 0 ? a.negate() : a.clone();
          if (x.compareTo(y) < 0) {
            var t = x;
            x = y;
            y = t;
          }
          var i = x.getLowestSetBit(), g = y.getLowestSetBit();
          if (g < 0) return x;
          if (i < g) g = i;
          if (g > 0) {
            x.rShiftTo(g, x);
            y.rShiftTo(g, y);
          }
          while (x.signum() > 0) {
            if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
            if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
            if (x.compareTo(y) >= 0) {
              x.subTo(y, x);
              x.rShiftTo(1, x);
            } else {
              y.subTo(x, y);
              y.rShiftTo(1, y);
            }
          }
          if (g > 0) y.lShiftTo(g, y);
          return y;
        }
        function bnpModInt(n) {
          if (n <= 0) return 0;
          var d = this.DV % n, r = this.s < 0 ? n - 1 : 0;
          if (this.t > 0)
            if (d == 0) r = this[0] % n;
            else
              for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
          return r;
        }
        function bnModInverse(m) {
          var ac = m.isEven();
          if (this.isEven() && ac || m.signum() == 0) return BigInteger.ZERO;
          var u = m.clone(), v = this.clone();
          var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
          while (u.signum() != 0) {
            while (u.isEven()) {
              u.rShiftTo(1, u);
              if (ac) {
                if (!a.isEven() || !b.isEven()) {
                  a.addTo(this, a);
                  b.subTo(m, b);
                }
                a.rShiftTo(1, a);
              } else if (!b.isEven()) b.subTo(m, b);
              b.rShiftTo(1, b);
            }
            while (v.isEven()) {
              v.rShiftTo(1, v);
              if (ac) {
                if (!c.isEven() || !d.isEven()) {
                  c.addTo(this, c);
                  d.subTo(m, d);
                }
                c.rShiftTo(1, c);
              } else if (!d.isEven()) d.subTo(m, d);
              d.rShiftTo(1, d);
            }
            if (u.compareTo(v) >= 0) {
              u.subTo(v, u);
              if (ac) a.subTo(c, a);
              b.subTo(d, b);
            } else {
              v.subTo(u, v);
              if (ac) c.subTo(a, c);
              d.subTo(b, d);
            }
          }
          if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
          if (d.compareTo(m) >= 0) return d.subtract(m);
          if (d.signum() < 0) d.addTo(m, d);
          else return d;
          if (d.signum() < 0) return d.add(m);
          else return d;
        }
        var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
        var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
        function bnIsProbablePrime(t) {
          var i, x = this.abs();
          if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
            for (i = 0; i < lowprimes.length; ++i)
              if (x[0] == lowprimes[i]) return true;
            return false;
          }
          if (x.isEven()) return false;
          i = 1;
          while (i < lowprimes.length) {
            var m = lowprimes[i], j = i + 1;
            while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
            m = x.modInt(m);
            while (i < j)
              if (m % lowprimes[i++] == 0) return false;
          }
          return x.millerRabin(t);
        }
        function bnpMillerRabin(t) {
          var n1 = this.subtract(BigInteger.ONE);
          var k = n1.getLowestSetBit();
          if (k <= 0) return false;
          var r = n1.shiftRight(k);
          t = t + 1 >> 1;
          if (t > lowprimes.length) t = lowprimes.length;
          var a = nbi();
          for (var i = 0; i < t; ++i) {
            a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
            var y = a.modPow(r, this);
            if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
              var j = 1;
              while (j++ < k && y.compareTo(n1) != 0) {
                y = y.modPowInt(2, this);
                if (y.compareTo(BigInteger.ONE) == 0) return false;
              }
              if (y.compareTo(n1) != 0) return false;
            }
          }
          return true;
        }
        BigInteger.prototype.chunkSize = bnpChunkSize;
        BigInteger.prototype.toRadix = bnpToRadix;
        BigInteger.prototype.fromRadix = bnpFromRadix;
        BigInteger.prototype.fromNumber = bnpFromNumber;
        BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
        BigInteger.prototype.changeBit = bnpChangeBit;
        BigInteger.prototype.addTo = bnpAddTo;
        BigInteger.prototype.dMultiply = bnpDMultiply;
        BigInteger.prototype.dAddOffset = bnpDAddOffset;
        BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
        BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
        BigInteger.prototype.modInt = bnpModInt;
        BigInteger.prototype.millerRabin = bnpMillerRabin;
        BigInteger.prototype.clone = bnClone;
        BigInteger.prototype.intValue = bnIntValue;
        BigInteger.prototype.byteValue = bnByteValue;
        BigInteger.prototype.shortValue = bnShortValue;
        BigInteger.prototype.signum = bnSigNum;
        BigInteger.prototype.toByteArray = bnToByteArray;
        BigInteger.prototype.equals = bnEquals;
        BigInteger.prototype.min = bnMin;
        BigInteger.prototype.max = bnMax;
        BigInteger.prototype.and = bnAnd;
        BigInteger.prototype.or = bnOr;
        BigInteger.prototype.xor = bnXor;
        BigInteger.prototype.andNot = bnAndNot;
        BigInteger.prototype.not = bnNot;
        BigInteger.prototype.shiftLeft = bnShiftLeft;
        BigInteger.prototype.shiftRight = bnShiftRight;
        BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
        BigInteger.prototype.bitCount = bnBitCount;
        BigInteger.prototype.testBit = bnTestBit;
        BigInteger.prototype.setBit = bnSetBit;
        BigInteger.prototype.clearBit = bnClearBit;
        BigInteger.prototype.flipBit = bnFlipBit;
        BigInteger.prototype.add = bnAdd;
        BigInteger.prototype.subtract = bnSubtract;
        BigInteger.prototype.multiply = bnMultiply;
        BigInteger.prototype.divide = bnDivide;
        BigInteger.prototype.remainder = bnRemainder;
        BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
        BigInteger.prototype.modPow = bnModPow;
        BigInteger.prototype.modInverse = bnModInverse;
        BigInteger.prototype.pow = bnPow;
        BigInteger.prototype.gcd = bnGCD;
        BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
        BigInteger.prototype.square = bnSquare;
        var Int128 = BigInteger;
        Int128.prototype.IsNegative = function() {
          if (this.compareTo(Int128.ZERO) == -1) return true;
          else return false;
        };
        Int128.op_Equality = function(val1, val2) {
          if (val1.compareTo(val2) == 0) return true;
          else return false;
        };
        Int128.op_Inequality = function(val1, val2) {
          if (val1.compareTo(val2) != 0) return true;
          else return false;
        };
        Int128.op_GreaterThan = function(val1, val2) {
          if (val1.compareTo(val2) > 0) return true;
          else return false;
        };
        Int128.op_LessThan = function(val1, val2) {
          if (val1.compareTo(val2) < 0) return true;
          else return false;
        };
        Int128.op_Addition = function(lhs, rhs) {
          return new Int128(lhs, void 0, void 0).add(new Int128(rhs, void 0, void 0));
        };
        Int128.op_Subtraction = function(lhs, rhs) {
          return new Int128(lhs, void 0, void 0).subtract(new Int128(rhs, void 0, void 0));
        };
        Int128.Int128Mul = function(lhs, rhs) {
          return new Int128(lhs, void 0, void 0).multiply(new Int128(rhs, void 0, void 0));
        };
        Int128.op_Division = function(lhs, rhs) {
          return lhs.divide(rhs);
        };
        Int128.prototype.ToDouble = function() {
          return parseFloat(this.toString());
        };
        var Inherit = function(ce, ce2) {
          var p;
          if (typeof Object.getOwnPropertyNames === "undefined") {
            for (p in ce2.prototype)
              if (typeof ce.prototype[p] === "undefined" || ce.prototype[p] === Object.prototype[p]) ce.prototype[p] = ce2.prototype[p];
            for (p in ce2)
              if (typeof ce[p] === "undefined") ce[p] = ce2[p];
            ce.$baseCtor = ce2;
          } else {
            var props = Object.getOwnPropertyNames(ce2.prototype);
            for (var i = 0; i < props.length; i++)
              if (typeof Object.getOwnPropertyDescriptor(ce.prototype, props[i]) === "undefined") Object.defineProperty(ce.prototype, props[i], Object.getOwnPropertyDescriptor(ce2.prototype, props[i]));
            for (p in ce2)
              if (typeof ce[p] === "undefined") ce[p] = ce2[p];
            ce.$baseCtor = ce2;
          }
        };
        ClipperLib2.Path = function() {
          return [];
        };
        ClipperLib2.Path.prototype.push = Array.prototype.push;
        ClipperLib2.Paths = function() {
          return [];
        };
        ClipperLib2.Paths.prototype.push = Array.prototype.push;
        ClipperLib2.DoublePoint = function() {
          var a = arguments;
          this.X = 0;
          this.Y = 0;
          if (a.length === 1) {
            this.X = a[0].X;
            this.Y = a[0].Y;
          } else if (a.length === 2) {
            this.X = a[0];
            this.Y = a[1];
          }
        };
        ClipperLib2.DoublePoint0 = function() {
          this.X = 0;
          this.Y = 0;
        };
        ClipperLib2.DoublePoint0.prototype = ClipperLib2.DoublePoint.prototype;
        ClipperLib2.DoublePoint1 = function(dp) {
          this.X = dp.X;
          this.Y = dp.Y;
        };
        ClipperLib2.DoublePoint1.prototype = ClipperLib2.DoublePoint.prototype;
        ClipperLib2.DoublePoint2 = function(x, y) {
          this.X = x;
          this.Y = y;
        };
        ClipperLib2.DoublePoint2.prototype = ClipperLib2.DoublePoint.prototype;
        ClipperLib2.PolyNode = function() {
          this.m_Parent = null;
          this.m_polygon = new ClipperLib2.Path();
          this.m_Index = 0;
          this.m_jointype = 0;
          this.m_endtype = 0;
          this.m_Childs = [];
          this.IsOpen = false;
        };
        ClipperLib2.PolyNode.prototype.IsHoleNode = function() {
          var result = true;
          var node = this.m_Parent;
          while (node !== null) {
            result = !result;
            node = node.m_Parent;
          }
          return result;
        };
        ClipperLib2.PolyNode.prototype.ChildCount = function() {
          return this.m_Childs.length;
        };
        ClipperLib2.PolyNode.prototype.Contour = function() {
          return this.m_polygon;
        };
        ClipperLib2.PolyNode.prototype.AddChild = function(Child) {
          var cnt = this.m_Childs.length;
          this.m_Childs.push(Child);
          Child.m_Parent = this;
          Child.m_Index = cnt;
        };
        ClipperLib2.PolyNode.prototype.GetNext = function() {
          if (this.m_Childs.length > 0)
            return this.m_Childs[0];
          else
            return this.GetNextSiblingUp();
        };
        ClipperLib2.PolyNode.prototype.GetNextSiblingUp = function() {
          if (this.m_Parent === null)
            return null;
          else if (this.m_Index === this.m_Parent.m_Childs.length - 1)
            return this.m_Parent.GetNextSiblingUp();
          else
            return this.m_Parent.m_Childs[this.m_Index + 1];
        };
        ClipperLib2.PolyNode.prototype.Childs = function() {
          return this.m_Childs;
        };
        ClipperLib2.PolyNode.prototype.Parent = function() {
          return this.m_Parent;
        };
        ClipperLib2.PolyNode.prototype.IsHole = function() {
          return this.IsHoleNode();
        };
        ClipperLib2.PolyTree = function() {
          this.m_AllPolys = [];
          ClipperLib2.PolyNode.call(this);
        };
        ClipperLib2.PolyTree.prototype.Clear = function() {
          for (var i = 0, ilen = this.m_AllPolys.length; i < ilen; i++)
            this.m_AllPolys[i] = null;
          this.m_AllPolys.length = 0;
          this.m_Childs.length = 0;
        };
        ClipperLib2.PolyTree.prototype.GetFirst = function() {
          if (this.m_Childs.length > 0)
            return this.m_Childs[0];
          else
            return null;
        };
        ClipperLib2.PolyTree.prototype.Total = function() {
          var result = this.m_AllPolys.length;
          if (result > 0 && this.m_Childs[0] !== this.m_AllPolys[0]) result--;
          return result;
        };
        Inherit(ClipperLib2.PolyTree, ClipperLib2.PolyNode);
        ClipperLib2.Math_Abs_Int64 = ClipperLib2.Math_Abs_Int32 = ClipperLib2.Math_Abs_Double = function(a) {
          return Math.abs(a);
        };
        ClipperLib2.Math_Max_Int32_Int32 = function(a, b) {
          return Math.max(a, b);
        };
        if (browser.msie || browser.opera || browser.safari) ClipperLib2.Cast_Int32 = function(a) {
          return a | 0;
        };
        else ClipperLib2.Cast_Int32 = function(a) {
          return ~~a;
        };
        if (typeof Number.toInteger === "undefined")
          Number.toInteger = null;
        if (browser.chrome) ClipperLib2.Cast_Int64 = function(a) {
          if (a < -2147483648 || a > 2147483647)
            return a < 0 ? Math.ceil(a) : Math.floor(a);
          else return ~~a;
        };
        else if (browser.firefox && typeof Number.toInteger === "function") ClipperLib2.Cast_Int64 = function(a) {
          return Number.toInteger(a);
        };
        else if (browser.msie7 || browser.msie8) ClipperLib2.Cast_Int64 = function(a) {
          return parseInt(a, 10);
        };
        else if (browser.msie) ClipperLib2.Cast_Int64 = function(a) {
          if (a < -2147483648 || a > 2147483647)
            return a < 0 ? Math.ceil(a) : Math.floor(a);
          return a | 0;
        };
        else ClipperLib2.Cast_Int64 = function(a) {
          return a < 0 ? Math.ceil(a) : Math.floor(a);
        };
        ClipperLib2.Clear = function(a) {
          a.length = 0;
        };
        ClipperLib2.PI = 3.141592653589793;
        ClipperLib2.PI2 = 2 * 3.141592653589793;
        ClipperLib2.IntPoint = function() {
          var a = arguments, alen = a.length;
          this.X = 0;
          this.Y = 0;
          if (ClipperLib2.use_xyz) {
            this.Z = 0;
            if (alen === 3) {
              this.X = a[0];
              this.Y = a[1];
              this.Z = a[2];
            } else if (alen === 2) {
              this.X = a[0];
              this.Y = a[1];
              this.Z = 0;
            } else if (alen === 1) {
              if (a[0] instanceof ClipperLib2.DoublePoint) {
                var dp = a[0];
                this.X = ClipperLib2.Clipper.Round(dp.X);
                this.Y = ClipperLib2.Clipper.Round(dp.Y);
                this.Z = 0;
              } else {
                var pt3 = a[0];
                if (typeof pt3.Z === "undefined") pt3.Z = 0;
                this.X = pt3.X;
                this.Y = pt3.Y;
                this.Z = pt3.Z;
              }
            } else {
              this.X = 0;
              this.Y = 0;
              this.Z = 0;
            }
          } else {
            if (alen === 2) {
              this.X = a[0];
              this.Y = a[1];
            } else if (alen === 1) {
              if (a[0] instanceof ClipperLib2.DoublePoint) {
                var dp = a[0];
                this.X = ClipperLib2.Clipper.Round(dp.X);
                this.Y = ClipperLib2.Clipper.Round(dp.Y);
              } else {
                var pt3 = a[0];
                this.X = pt3.X;
                this.Y = pt3.Y;
              }
            } else {
              this.X = 0;
              this.Y = 0;
            }
          }
        };
        ClipperLib2.IntPoint.op_Equality = function(a, b) {
          return a.X === b.X && a.Y === b.Y;
        };
        ClipperLib2.IntPoint.op_Inequality = function(a, b) {
          return a.X !== b.X || a.Y !== b.Y;
        };
        ClipperLib2.IntPoint0 = function() {
          this.X = 0;
          this.Y = 0;
          if (ClipperLib2.use_xyz)
            this.Z = 0;
        };
        ClipperLib2.IntPoint0.prototype = ClipperLib2.IntPoint.prototype;
        ClipperLib2.IntPoint1 = function(pt3) {
          this.X = pt3.X;
          this.Y = pt3.Y;
          if (ClipperLib2.use_xyz) {
            if (typeof pt3.Z === "undefined") this.Z = 0;
            else this.Z = pt3.Z;
          }
        };
        ClipperLib2.IntPoint1.prototype = ClipperLib2.IntPoint.prototype;
        ClipperLib2.IntPoint1dp = function(dp) {
          this.X = ClipperLib2.Clipper.Round(dp.X);
          this.Y = ClipperLib2.Clipper.Round(dp.Y);
          if (ClipperLib2.use_xyz)
            this.Z = 0;
        };
        ClipperLib2.IntPoint1dp.prototype = ClipperLib2.IntPoint.prototype;
        ClipperLib2.IntPoint2 = function(x, y, z) {
          this.X = x;
          this.Y = y;
          if (ClipperLib2.use_xyz) {
            if (typeof z === "undefined") this.Z = 0;
            else this.Z = z;
          }
        };
        ClipperLib2.IntPoint2.prototype = ClipperLib2.IntPoint.prototype;
        ClipperLib2.IntRect = function() {
          var a = arguments, alen = a.length;
          if (alen === 4) {
            this.left = a[0];
            this.top = a[1];
            this.right = a[2];
            this.bottom = a[3];
          } else if (alen === 1) {
            var ir = a[0];
            this.left = ir.left;
            this.top = ir.top;
            this.right = ir.right;
            this.bottom = ir.bottom;
          } else {
            this.left = 0;
            this.top = 0;
            this.right = 0;
            this.bottom = 0;
          }
        };
        ClipperLib2.IntRect0 = function() {
          this.left = 0;
          this.top = 0;
          this.right = 0;
          this.bottom = 0;
        };
        ClipperLib2.IntRect0.prototype = ClipperLib2.IntRect.prototype;
        ClipperLib2.IntRect1 = function(ir) {
          this.left = ir.left;
          this.top = ir.top;
          this.right = ir.right;
          this.bottom = ir.bottom;
        };
        ClipperLib2.IntRect1.prototype = ClipperLib2.IntRect.prototype;
        ClipperLib2.IntRect4 = function(l, t, r, b) {
          this.left = l;
          this.top = t;
          this.right = r;
          this.bottom = b;
        };
        ClipperLib2.IntRect4.prototype = ClipperLib2.IntRect.prototype;
        ClipperLib2.ClipType = {
          ctIntersection: 0,
          ctUnion: 1,
          ctDifference: 2,
          ctXor: 3
        };
        ClipperLib2.PolyType = {
          ptSubject: 0,
          ptClip: 1
        };
        ClipperLib2.PolyFillType = {
          pftEvenOdd: 0,
          pftNonZero: 1,
          pftPositive: 2,
          pftNegative: 3
        };
        ClipperLib2.JoinType = {
          jtSquare: 0,
          jtRound: 1,
          jtMiter: 2
        };
        ClipperLib2.EndType = {
          etOpenSquare: 0,
          etOpenRound: 1,
          etOpenButt: 2,
          etClosedLine: 3,
          etClosedPolygon: 4
        };
        ClipperLib2.EdgeSide = {
          esLeft: 0,
          esRight: 1
        };
        ClipperLib2.Direction = {
          dRightToLeft: 0,
          dLeftToRight: 1
        };
        ClipperLib2.TEdge = function() {
          this.Bot = new ClipperLib2.IntPoint0();
          this.Curr = new ClipperLib2.IntPoint0();
          this.Top = new ClipperLib2.IntPoint0();
          this.Delta = new ClipperLib2.IntPoint0();
          this.Dx = 0;
          this.PolyTyp = ClipperLib2.PolyType.ptSubject;
          this.Side = ClipperLib2.EdgeSide.esLeft;
          this.WindDelta = 0;
          this.WindCnt = 0;
          this.WindCnt2 = 0;
          this.OutIdx = 0;
          this.Next = null;
          this.Prev = null;
          this.NextInLML = null;
          this.NextInAEL = null;
          this.PrevInAEL = null;
          this.NextInSEL = null;
          this.PrevInSEL = null;
        };
        ClipperLib2.IntersectNode = function() {
          this.Edge1 = null;
          this.Edge2 = null;
          this.Pt = new ClipperLib2.IntPoint0();
        };
        ClipperLib2.MyIntersectNodeSort = function() {
        };
        ClipperLib2.MyIntersectNodeSort.Compare = function(node1, node2) {
          var i = node2.Pt.Y - node1.Pt.Y;
          if (i > 0) return 1;
          else if (i < 0) return -1;
          else return 0;
        };
        ClipperLib2.LocalMinima = function() {
          this.Y = 0;
          this.LeftBound = null;
          this.RightBound = null;
          this.Next = null;
        };
        ClipperLib2.Scanbeam = function() {
          this.Y = 0;
          this.Next = null;
        };
        ClipperLib2.Maxima = function() {
          this.X = 0;
          this.Next = null;
          this.Prev = null;
        };
        ClipperLib2.OutRec = function() {
          this.Idx = 0;
          this.IsHole = false;
          this.IsOpen = false;
          this.FirstLeft = null;
          this.Pts = null;
          this.BottomPt = null;
          this.PolyNode = null;
        };
        ClipperLib2.OutPt = function() {
          this.Idx = 0;
          this.Pt = new ClipperLib2.IntPoint0();
          this.Next = null;
          this.Prev = null;
        };
        ClipperLib2.Join = function() {
          this.OutPt1 = null;
          this.OutPt2 = null;
          this.OffPt = new ClipperLib2.IntPoint0();
        };
        ClipperLib2.ClipperBase = function() {
          this.m_MinimaList = null;
          this.m_CurrentLM = null;
          this.m_edges = new Array();
          this.m_UseFullRange = false;
          this.m_HasOpenPaths = false;
          this.PreserveCollinear = false;
          this.m_Scanbeam = null;
          this.m_PolyOuts = null;
          this.m_ActiveEdges = null;
        };
        ClipperLib2.ClipperBase.horizontal = -9007199254740992;
        ClipperLib2.ClipperBase.Skip = -2;
        ClipperLib2.ClipperBase.Unassigned = -1;
        ClipperLib2.ClipperBase.tolerance = 1e-20;
        ClipperLib2.ClipperBase.loRange = 47453132;
        ClipperLib2.ClipperBase.hiRange = 4503599627370495;
        ClipperLib2.ClipperBase.near_zero = function(val) {
          return val > -ClipperLib2.ClipperBase.tolerance && val < ClipperLib2.ClipperBase.tolerance;
        };
        ClipperLib2.ClipperBase.IsHorizontal = function(e) {
          return e.Delta.Y === 0;
        };
        ClipperLib2.ClipperBase.prototype.PointIsVertex = function(pt3, pp) {
          var pp2 = pp;
          do {
            if (ClipperLib2.IntPoint.op_Equality(pp2.Pt, pt3))
              return true;
            pp2 = pp2.Next;
          } while (pp2 !== pp);
          return false;
        };
        ClipperLib2.ClipperBase.prototype.PointOnLineSegment = function(pt3, linePt1, linePt2, UseFullRange) {
          if (UseFullRange)
            return pt3.X === linePt1.X && pt3.Y === linePt1.Y || pt3.X === linePt2.X && pt3.Y === linePt2.Y || pt3.X > linePt1.X === pt3.X < linePt2.X && pt3.Y > linePt1.Y === pt3.Y < linePt2.Y && Int128.op_Equality(
              Int128.Int128Mul(pt3.X - linePt1.X, linePt2.Y - linePt1.Y),
              Int128.Int128Mul(linePt2.X - linePt1.X, pt3.Y - linePt1.Y)
            );
          else
            return pt3.X === linePt1.X && pt3.Y === linePt1.Y || pt3.X === linePt2.X && pt3.Y === linePt2.Y || pt3.X > linePt1.X === pt3.X < linePt2.X && pt3.Y > linePt1.Y === pt3.Y < linePt2.Y && (pt3.X - linePt1.X) * (linePt2.Y - linePt1.Y) === (linePt2.X - linePt1.X) * (pt3.Y - linePt1.Y);
        };
        ClipperLib2.ClipperBase.prototype.PointOnPolygon = function(pt3, pp, UseFullRange) {
          var pp2 = pp;
          while (true) {
            if (this.PointOnLineSegment(pt3, pp2.Pt, pp2.Next.Pt, UseFullRange))
              return true;
            pp2 = pp2.Next;
            if (pp2 === pp)
              break;
          }
          return false;
        };
        ClipperLib2.ClipperBase.prototype.SlopesEqual = ClipperLib2.ClipperBase.SlopesEqual = function() {
          var a = arguments, alen = a.length;
          var e1, e2, pt1, pt22, pt3, pt4, UseFullRange;
          if (alen === 3) {
            e1 = a[0];
            e2 = a[1];
            UseFullRange = a[2];
            if (UseFullRange)
              return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
            else
              return ClipperLib2.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib2.Cast_Int64(e1.Delta.X * e2.Delta.Y);
          } else if (alen === 4) {
            pt1 = a[0];
            pt22 = a[1];
            pt3 = a[2];
            UseFullRange = a[3];
            if (UseFullRange)
              return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt22.Y, pt22.X - pt3.X), Int128.Int128Mul(pt1.X - pt22.X, pt22.Y - pt3.Y));
            else
              return ClipperLib2.Cast_Int64((pt1.Y - pt22.Y) * (pt22.X - pt3.X)) - ClipperLib2.Cast_Int64((pt1.X - pt22.X) * (pt22.Y - pt3.Y)) === 0;
          } else {
            pt1 = a[0];
            pt22 = a[1];
            pt3 = a[2];
            pt4 = a[3];
            UseFullRange = a[4];
            if (UseFullRange)
              return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt22.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt22.X, pt3.Y - pt4.Y));
            else
              return ClipperLib2.Cast_Int64((pt1.Y - pt22.Y) * (pt3.X - pt4.X)) - ClipperLib2.Cast_Int64((pt1.X - pt22.X) * (pt3.Y - pt4.Y)) === 0;
          }
        };
        ClipperLib2.ClipperBase.SlopesEqual3 = function(e1, e2, UseFullRange) {
          if (UseFullRange)
            return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
          else
            return ClipperLib2.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib2.Cast_Int64(e1.Delta.X * e2.Delta.Y);
        };
        ClipperLib2.ClipperBase.SlopesEqual4 = function(pt1, pt22, pt3, UseFullRange) {
          if (UseFullRange)
            return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt22.Y, pt22.X - pt3.X), Int128.Int128Mul(pt1.X - pt22.X, pt22.Y - pt3.Y));
          else
            return ClipperLib2.Cast_Int64((pt1.Y - pt22.Y) * (pt22.X - pt3.X)) - ClipperLib2.Cast_Int64((pt1.X - pt22.X) * (pt22.Y - pt3.Y)) === 0;
        };
        ClipperLib2.ClipperBase.SlopesEqual5 = function(pt1, pt22, pt3, pt4, UseFullRange) {
          if (UseFullRange)
            return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt22.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt22.X, pt3.Y - pt4.Y));
          else
            return ClipperLib2.Cast_Int64((pt1.Y - pt22.Y) * (pt3.X - pt4.X)) - ClipperLib2.Cast_Int64((pt1.X - pt22.X) * (pt3.Y - pt4.Y)) === 0;
        };
        ClipperLib2.ClipperBase.prototype.Clear = function() {
          this.DisposeLocalMinimaList();
          for (var i = 0, ilen = this.m_edges.length; i < ilen; ++i) {
            for (var j = 0, jlen = this.m_edges[i].length; j < jlen; ++j)
              this.m_edges[i][j] = null;
            ClipperLib2.Clear(this.m_edges[i]);
          }
          ClipperLib2.Clear(this.m_edges);
          this.m_UseFullRange = false;
          this.m_HasOpenPaths = false;
        };
        ClipperLib2.ClipperBase.prototype.DisposeLocalMinimaList = function() {
          while (this.m_MinimaList !== null) {
            var tmpLm = this.m_MinimaList.Next;
            this.m_MinimaList = null;
            this.m_MinimaList = tmpLm;
          }
          this.m_CurrentLM = null;
        };
        ClipperLib2.ClipperBase.prototype.RangeTest = function(Pt, useFullRange) {
          if (useFullRange.Value) {
            if (Pt.X > ClipperLib2.ClipperBase.hiRange || Pt.Y > ClipperLib2.ClipperBase.hiRange || -Pt.X > ClipperLib2.ClipperBase.hiRange || -Pt.Y > ClipperLib2.ClipperBase.hiRange)
              ClipperLib2.Error("Coordinate outside allowed range in RangeTest().");
          } else if (Pt.X > ClipperLib2.ClipperBase.loRange || Pt.Y > ClipperLib2.ClipperBase.loRange || -Pt.X > ClipperLib2.ClipperBase.loRange || -Pt.Y > ClipperLib2.ClipperBase.loRange) {
            useFullRange.Value = true;
            this.RangeTest(Pt, useFullRange);
          }
        };
        ClipperLib2.ClipperBase.prototype.InitEdge = function(e, eNext, ePrev, pt3) {
          e.Next = eNext;
          e.Prev = ePrev;
          e.Curr.X = pt3.X;
          e.Curr.Y = pt3.Y;
          if (ClipperLib2.use_xyz) e.Curr.Z = pt3.Z;
          e.OutIdx = -1;
        };
        ClipperLib2.ClipperBase.prototype.InitEdge2 = function(e, polyType) {
          if (e.Curr.Y >= e.Next.Curr.Y) {
            e.Bot.X = e.Curr.X;
            e.Bot.Y = e.Curr.Y;
            if (ClipperLib2.use_xyz) e.Bot.Z = e.Curr.Z;
            e.Top.X = e.Next.Curr.X;
            e.Top.Y = e.Next.Curr.Y;
            if (ClipperLib2.use_xyz) e.Top.Z = e.Next.Curr.Z;
          } else {
            e.Top.X = e.Curr.X;
            e.Top.Y = e.Curr.Y;
            if (ClipperLib2.use_xyz) e.Top.Z = e.Curr.Z;
            e.Bot.X = e.Next.Curr.X;
            e.Bot.Y = e.Next.Curr.Y;
            if (ClipperLib2.use_xyz) e.Bot.Z = e.Next.Curr.Z;
          }
          this.SetDx(e);
          e.PolyTyp = polyType;
        };
        ClipperLib2.ClipperBase.prototype.FindNextLocMin = function(E) {
          var E2;
          for (; ; ) {
            while (ClipperLib2.IntPoint.op_Inequality(E.Bot, E.Prev.Bot) || ClipperLib2.IntPoint.op_Equality(E.Curr, E.Top))
              E = E.Next;
            if (E.Dx !== ClipperLib2.ClipperBase.horizontal && E.Prev.Dx !== ClipperLib2.ClipperBase.horizontal)
              break;
            while (E.Prev.Dx === ClipperLib2.ClipperBase.horizontal)
              E = E.Prev;
            E2 = E;
            while (E.Dx === ClipperLib2.ClipperBase.horizontal)
              E = E.Next;
            if (E.Top.Y === E.Prev.Bot.Y)
              continue;
            if (E2.Prev.Bot.X < E.Bot.X)
              E = E2;
            break;
          }
          return E;
        };
        ClipperLib2.ClipperBase.prototype.ProcessBound = function(E, LeftBoundIsForward) {
          var EStart;
          var Result = E;
          var Horz;
          if (Result.OutIdx === ClipperLib2.ClipperBase.Skip) {
            E = Result;
            if (LeftBoundIsForward) {
              while (E.Top.Y === E.Next.Bot.Y) E = E.Next;
              while (E !== Result && E.Dx === ClipperLib2.ClipperBase.horizontal) E = E.Prev;
            } else {
              while (E.Top.Y === E.Prev.Bot.Y) E = E.Prev;
              while (E !== Result && E.Dx === ClipperLib2.ClipperBase.horizontal) E = E.Next;
            }
            if (E === Result) {
              if (LeftBoundIsForward) Result = E.Next;
              else Result = E.Prev;
            } else {
              if (LeftBoundIsForward)
                E = Result.Next;
              else
                E = Result.Prev;
              var locMin = new ClipperLib2.LocalMinima();
              locMin.Next = null;
              locMin.Y = E.Bot.Y;
              locMin.LeftBound = null;
              locMin.RightBound = E;
              E.WindDelta = 0;
              Result = this.ProcessBound(E, LeftBoundIsForward);
              this.InsertLocalMinima(locMin);
            }
            return Result;
          }
          if (E.Dx === ClipperLib2.ClipperBase.horizontal) {
            if (LeftBoundIsForward) EStart = E.Prev;
            else EStart = E.Next;
            if (EStart.Dx === ClipperLib2.ClipperBase.horizontal) {
              if (EStart.Bot.X !== E.Bot.X && EStart.Top.X !== E.Bot.X)
                this.ReverseHorizontal(E);
            } else if (EStart.Bot.X !== E.Bot.X)
              this.ReverseHorizontal(E);
          }
          EStart = E;
          if (LeftBoundIsForward) {
            while (Result.Top.Y === Result.Next.Bot.Y && Result.Next.OutIdx !== ClipperLib2.ClipperBase.Skip)
              Result = Result.Next;
            if (Result.Dx === ClipperLib2.ClipperBase.horizontal && Result.Next.OutIdx !== ClipperLib2.ClipperBase.Skip) {
              Horz = Result;
              while (Horz.Prev.Dx === ClipperLib2.ClipperBase.horizontal)
                Horz = Horz.Prev;
              if (Horz.Prev.Top.X > Result.Next.Top.X)
                Result = Horz.Prev;
            }
            while (E !== Result) {
              E.NextInLML = E.Next;
              if (E.Dx === ClipperLib2.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X)
                this.ReverseHorizontal(E);
              E = E.Next;
            }
            if (E.Dx === ClipperLib2.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X)
              this.ReverseHorizontal(E);
            Result = Result.Next;
          } else {
            while (Result.Top.Y === Result.Prev.Bot.Y && Result.Prev.OutIdx !== ClipperLib2.ClipperBase.Skip)
              Result = Result.Prev;
            if (Result.Dx === ClipperLib2.ClipperBase.horizontal && Result.Prev.OutIdx !== ClipperLib2.ClipperBase.Skip) {
              Horz = Result;
              while (Horz.Next.Dx === ClipperLib2.ClipperBase.horizontal)
                Horz = Horz.Next;
              if (Horz.Next.Top.X === Result.Prev.Top.X || Horz.Next.Top.X > Result.Prev.Top.X) {
                Result = Horz.Next;
              }
            }
            while (E !== Result) {
              E.NextInLML = E.Prev;
              if (E.Dx === ClipperLib2.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X)
                this.ReverseHorizontal(E);
              E = E.Prev;
            }
            if (E.Dx === ClipperLib2.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X)
              this.ReverseHorizontal(E);
            Result = Result.Prev;
          }
          return Result;
        };
        ClipperLib2.ClipperBase.prototype.AddPath = function(pg, polyType, Closed) {
          if (ClipperLib2.use_lines) {
            if (!Closed && polyType === ClipperLib2.PolyType.ptClip)
              ClipperLib2.Error("AddPath: Open paths must be subject.");
          } else {
            if (!Closed)
              ClipperLib2.Error("AddPath: Open paths have been disabled.");
          }
          var highI = pg.length - 1;
          if (Closed)
            while (highI > 0 && ClipperLib2.IntPoint.op_Equality(pg[highI], pg[0]))
              --highI;
          while (highI > 0 && ClipperLib2.IntPoint.op_Equality(pg[highI], pg[highI - 1]))
            --highI;
          if (Closed && highI < 2 || !Closed && highI < 1)
            return false;
          var edges = new Array();
          for (var i = 0; i <= highI; i++)
            edges.push(new ClipperLib2.TEdge());
          var IsFlat = true;
          edges[1].Curr.X = pg[1].X;
          edges[1].Curr.Y = pg[1].Y;
          if (ClipperLib2.use_xyz) edges[1].Curr.Z = pg[1].Z;
          var $1 = {
            Value: this.m_UseFullRange
          };
          this.RangeTest(pg[0], $1);
          this.m_UseFullRange = $1.Value;
          $1.Value = this.m_UseFullRange;
          this.RangeTest(pg[highI], $1);
          this.m_UseFullRange = $1.Value;
          this.InitEdge(edges[0], edges[1], edges[highI], pg[0]);
          this.InitEdge(edges[highI], edges[0], edges[highI - 1], pg[highI]);
          for (var i = highI - 1; i >= 1; --i) {
            $1.Value = this.m_UseFullRange;
            this.RangeTest(pg[i], $1);
            this.m_UseFullRange = $1.Value;
            this.InitEdge(edges[i], edges[i + 1], edges[i - 1], pg[i]);
          }
          var eStart = edges[0];
          var E = eStart, eLoopStop = eStart;
          for (; ; ) {
            if (E.Curr === E.Next.Curr && (Closed || E.Next !== eStart)) {
              if (E === E.Next)
                break;
              if (E === eStart)
                eStart = E.Next;
              E = this.RemoveEdge(E);
              eLoopStop = E;
              continue;
            }
            if (E.Prev === E.Next)
              break;
            else if (Closed && ClipperLib2.ClipperBase.SlopesEqual4(E.Prev.Curr, E.Curr, E.Next.Curr, this.m_UseFullRange) && (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(E.Prev.Curr, E.Curr, E.Next.Curr))) {
              if (E === eStart)
                eStart = E.Next;
              E = this.RemoveEdge(E);
              E = E.Prev;
              eLoopStop = E;
              continue;
            }
            E = E.Next;
            if (E === eLoopStop || !Closed && E.Next === eStart) break;
          }
          if (!Closed && E === E.Next || Closed && E.Prev === E.Next)
            return false;
          if (!Closed) {
            this.m_HasOpenPaths = true;
            eStart.Prev.OutIdx = ClipperLib2.ClipperBase.Skip;
          }
          E = eStart;
          do {
            this.InitEdge2(E, polyType);
            E = E.Next;
            if (IsFlat && E.Curr.Y !== eStart.Curr.Y)
              IsFlat = false;
          } while (E !== eStart);
          if (IsFlat) {
            if (Closed)
              return false;
            E.Prev.OutIdx = ClipperLib2.ClipperBase.Skip;
            var locMin = new ClipperLib2.LocalMinima();
            locMin.Next = null;
            locMin.Y = E.Bot.Y;
            locMin.LeftBound = null;
            locMin.RightBound = E;
            locMin.RightBound.Side = ClipperLib2.EdgeSide.esRight;
            locMin.RightBound.WindDelta = 0;
            for (; ; ) {
              if (E.Bot.X !== E.Prev.Top.X) this.ReverseHorizontal(E);
              if (E.Next.OutIdx === ClipperLib2.ClipperBase.Skip) break;
              E.NextInLML = E.Next;
              E = E.Next;
            }
            this.InsertLocalMinima(locMin);
            this.m_edges.push(edges);
            return true;
          }
          this.m_edges.push(edges);
          var leftBoundIsForward;
          var EMin = null;
          if (ClipperLib2.IntPoint.op_Equality(E.Prev.Bot, E.Prev.Top))
            E = E.Next;
          for (; ; ) {
            E = this.FindNextLocMin(E);
            if (E === EMin)
              break;
            else if (EMin === null)
              EMin = E;
            var locMin = new ClipperLib2.LocalMinima();
            locMin.Next = null;
            locMin.Y = E.Bot.Y;
            if (E.Dx < E.Prev.Dx) {
              locMin.LeftBound = E.Prev;
              locMin.RightBound = E;
              leftBoundIsForward = false;
            } else {
              locMin.LeftBound = E;
              locMin.RightBound = E.Prev;
              leftBoundIsForward = true;
            }
            locMin.LeftBound.Side = ClipperLib2.EdgeSide.esLeft;
            locMin.RightBound.Side = ClipperLib2.EdgeSide.esRight;
            if (!Closed)
              locMin.LeftBound.WindDelta = 0;
            else if (locMin.LeftBound.Next === locMin.RightBound)
              locMin.LeftBound.WindDelta = -1;
            else
              locMin.LeftBound.WindDelta = 1;
            locMin.RightBound.WindDelta = -locMin.LeftBound.WindDelta;
            E = this.ProcessBound(locMin.LeftBound, leftBoundIsForward);
            if (E.OutIdx === ClipperLib2.ClipperBase.Skip)
              E = this.ProcessBound(E, leftBoundIsForward);
            var E2 = this.ProcessBound(locMin.RightBound, !leftBoundIsForward);
            if (E2.OutIdx === ClipperLib2.ClipperBase.Skip) E2 = this.ProcessBound(E2, !leftBoundIsForward);
            if (locMin.LeftBound.OutIdx === ClipperLib2.ClipperBase.Skip)
              locMin.LeftBound = null;
            else if (locMin.RightBound.OutIdx === ClipperLib2.ClipperBase.Skip)
              locMin.RightBound = null;
            this.InsertLocalMinima(locMin);
            if (!leftBoundIsForward)
              E = E2;
          }
          return true;
        };
        ClipperLib2.ClipperBase.prototype.AddPaths = function(ppg, polyType, closed) {
          var result = false;
          for (var i = 0, ilen = ppg.length; i < ilen; ++i)
            if (this.AddPath(ppg[i], polyType, closed))
              result = true;
          return result;
        };
        ClipperLib2.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3 = function(pt1, pt22, pt3) {
          if (ClipperLib2.IntPoint.op_Equality(pt1, pt3) || ClipperLib2.IntPoint.op_Equality(pt1, pt22) || ClipperLib2.IntPoint.op_Equality(pt3, pt22))
            return false;
          else if (pt1.X !== pt3.X)
            return pt22.X > pt1.X === pt22.X < pt3.X;
          else
            return pt22.Y > pt1.Y === pt22.Y < pt3.Y;
        };
        ClipperLib2.ClipperBase.prototype.RemoveEdge = function(e) {
          e.Prev.Next = e.Next;
          e.Next.Prev = e.Prev;
          var result = e.Next;
          e.Prev = null;
          return result;
        };
        ClipperLib2.ClipperBase.prototype.SetDx = function(e) {
          e.Delta.X = e.Top.X - e.Bot.X;
          e.Delta.Y = e.Top.Y - e.Bot.Y;
          if (e.Delta.Y === 0) e.Dx = ClipperLib2.ClipperBase.horizontal;
          else e.Dx = e.Delta.X / e.Delta.Y;
        };
        ClipperLib2.ClipperBase.prototype.InsertLocalMinima = function(newLm) {
          if (this.m_MinimaList === null) {
            this.m_MinimaList = newLm;
          } else if (newLm.Y >= this.m_MinimaList.Y) {
            newLm.Next = this.m_MinimaList;
            this.m_MinimaList = newLm;
          } else {
            var tmpLm = this.m_MinimaList;
            while (tmpLm.Next !== null && newLm.Y < tmpLm.Next.Y)
              tmpLm = tmpLm.Next;
            newLm.Next = tmpLm.Next;
            tmpLm.Next = newLm;
          }
        };
        ClipperLib2.ClipperBase.prototype.PopLocalMinima = function(Y, current) {
          current.v = this.m_CurrentLM;
          if (this.m_CurrentLM !== null && this.m_CurrentLM.Y === Y) {
            this.m_CurrentLM = this.m_CurrentLM.Next;
            return true;
          }
          return false;
        };
        ClipperLib2.ClipperBase.prototype.ReverseHorizontal = function(e) {
          var tmp = e.Top.X;
          e.Top.X = e.Bot.X;
          e.Bot.X = tmp;
          if (ClipperLib2.use_xyz) {
            tmp = e.Top.Z;
            e.Top.Z = e.Bot.Z;
            e.Bot.Z = tmp;
          }
        };
        ClipperLib2.ClipperBase.prototype.Reset = function() {
          this.m_CurrentLM = this.m_MinimaList;
          if (this.m_CurrentLM === null)
            return;
          this.m_Scanbeam = null;
          var lm = this.m_MinimaList;
          while (lm !== null) {
            this.InsertScanbeam(lm.Y);
            var e = lm.LeftBound;
            if (e !== null) {
              e.Curr.X = e.Bot.X;
              e.Curr.Y = e.Bot.Y;
              if (ClipperLib2.use_xyz) e.Curr.Z = e.Bot.Z;
              e.OutIdx = ClipperLib2.ClipperBase.Unassigned;
            }
            e = lm.RightBound;
            if (e !== null) {
              e.Curr.X = e.Bot.X;
              e.Curr.Y = e.Bot.Y;
              if (ClipperLib2.use_xyz) e.Curr.Z = e.Bot.Z;
              e.OutIdx = ClipperLib2.ClipperBase.Unassigned;
            }
            lm = lm.Next;
          }
          this.m_ActiveEdges = null;
        };
        ClipperLib2.ClipperBase.prototype.InsertScanbeam = function(Y) {
          if (this.m_Scanbeam === null) {
            this.m_Scanbeam = new ClipperLib2.Scanbeam();
            this.m_Scanbeam.Next = null;
            this.m_Scanbeam.Y = Y;
          } else if (Y > this.m_Scanbeam.Y) {
            var newSb = new ClipperLib2.Scanbeam();
            newSb.Y = Y;
            newSb.Next = this.m_Scanbeam;
            this.m_Scanbeam = newSb;
          } else {
            var sb2 = this.m_Scanbeam;
            while (sb2.Next !== null && Y <= sb2.Next.Y) {
              sb2 = sb2.Next;
            }
            if (Y === sb2.Y) {
              return;
            }
            var newSb1 = new ClipperLib2.Scanbeam();
            newSb1.Y = Y;
            newSb1.Next = sb2.Next;
            sb2.Next = newSb1;
          }
        };
        ClipperLib2.ClipperBase.prototype.PopScanbeam = function(Y) {
          if (this.m_Scanbeam === null) {
            Y.v = 0;
            return false;
          }
          Y.v = this.m_Scanbeam.Y;
          this.m_Scanbeam = this.m_Scanbeam.Next;
          return true;
        };
        ClipperLib2.ClipperBase.prototype.LocalMinimaPending = function() {
          return this.m_CurrentLM !== null;
        };
        ClipperLib2.ClipperBase.prototype.CreateOutRec = function() {
          var result = new ClipperLib2.OutRec();
          result.Idx = ClipperLib2.ClipperBase.Unassigned;
          result.IsHole = false;
          result.IsOpen = false;
          result.FirstLeft = null;
          result.Pts = null;
          result.BottomPt = null;
          result.PolyNode = null;
          this.m_PolyOuts.push(result);
          result.Idx = this.m_PolyOuts.length - 1;
          return result;
        };
        ClipperLib2.ClipperBase.prototype.DisposeOutRec = function(index) {
          var outRec = this.m_PolyOuts[index];
          outRec.Pts = null;
          outRec = null;
          this.m_PolyOuts[index] = null;
        };
        ClipperLib2.ClipperBase.prototype.UpdateEdgeIntoAEL = function(e) {
          if (e.NextInLML === null) {
            ClipperLib2.Error("UpdateEdgeIntoAEL: invalid call");
          }
          var AelPrev = e.PrevInAEL;
          var AelNext = e.NextInAEL;
          e.NextInLML.OutIdx = e.OutIdx;
          if (AelPrev !== null) {
            AelPrev.NextInAEL = e.NextInLML;
          } else {
            this.m_ActiveEdges = e.NextInLML;
          }
          if (AelNext !== null) {
            AelNext.PrevInAEL = e.NextInLML;
          }
          e.NextInLML.Side = e.Side;
          e.NextInLML.WindDelta = e.WindDelta;
          e.NextInLML.WindCnt = e.WindCnt;
          e.NextInLML.WindCnt2 = e.WindCnt2;
          e = e.NextInLML;
          e.Curr.X = e.Bot.X;
          e.Curr.Y = e.Bot.Y;
          e.PrevInAEL = AelPrev;
          e.NextInAEL = AelNext;
          if (!ClipperLib2.ClipperBase.IsHorizontal(e)) {
            this.InsertScanbeam(e.Top.Y);
          }
          return e;
        };
        ClipperLib2.ClipperBase.prototype.SwapPositionsInAEL = function(edge1, edge2) {
          if (edge1.NextInAEL === edge1.PrevInAEL || edge2.NextInAEL === edge2.PrevInAEL) {
            return;
          }
          if (edge1.NextInAEL === edge2) {
            var next = edge2.NextInAEL;
            if (next !== null) {
              next.PrevInAEL = edge1;
            }
            var prev = edge1.PrevInAEL;
            if (prev !== null) {
              prev.NextInAEL = edge2;
            }
            edge2.PrevInAEL = prev;
            edge2.NextInAEL = edge1;
            edge1.PrevInAEL = edge2;
            edge1.NextInAEL = next;
          } else if (edge2.NextInAEL === edge1) {
            var next1 = edge1.NextInAEL;
            if (next1 !== null) {
              next1.PrevInAEL = edge2;
            }
            var prev1 = edge2.PrevInAEL;
            if (prev1 !== null) {
              prev1.NextInAEL = edge1;
            }
            edge1.PrevInAEL = prev1;
            edge1.NextInAEL = edge2;
            edge2.PrevInAEL = edge1;
            edge2.NextInAEL = next1;
          } else {
            var next2 = edge1.NextInAEL;
            var prev2 = edge1.PrevInAEL;
            edge1.NextInAEL = edge2.NextInAEL;
            if (edge1.NextInAEL !== null) {
              edge1.NextInAEL.PrevInAEL = edge1;
            }
            edge1.PrevInAEL = edge2.PrevInAEL;
            if (edge1.PrevInAEL !== null) {
              edge1.PrevInAEL.NextInAEL = edge1;
            }
            edge2.NextInAEL = next2;
            if (edge2.NextInAEL !== null) {
              edge2.NextInAEL.PrevInAEL = edge2;
            }
            edge2.PrevInAEL = prev2;
            if (edge2.PrevInAEL !== null) {
              edge2.PrevInAEL.NextInAEL = edge2;
            }
          }
          if (edge1.PrevInAEL === null) {
            this.m_ActiveEdges = edge1;
          } else {
            if (edge2.PrevInAEL === null) {
              this.m_ActiveEdges = edge2;
            }
          }
        };
        ClipperLib2.ClipperBase.prototype.DeleteFromAEL = function(e) {
          var AelPrev = e.PrevInAEL;
          var AelNext = e.NextInAEL;
          if (AelPrev === null && AelNext === null && e !== this.m_ActiveEdges) {
            return;
          }
          if (AelPrev !== null) {
            AelPrev.NextInAEL = AelNext;
          } else {
            this.m_ActiveEdges = AelNext;
          }
          if (AelNext !== null) {
            AelNext.PrevInAEL = AelPrev;
          }
          e.NextInAEL = null;
          e.PrevInAEL = null;
        };
        ClipperLib2.Clipper = function(InitOptions) {
          if (typeof InitOptions === "undefined") InitOptions = 0;
          this.m_PolyOuts = null;
          this.m_ClipType = ClipperLib2.ClipType.ctIntersection;
          this.m_Scanbeam = null;
          this.m_Maxima = null;
          this.m_ActiveEdges = null;
          this.m_SortedEdges = null;
          this.m_IntersectList = null;
          this.m_IntersectNodeComparer = null;
          this.m_ExecuteLocked = false;
          this.m_ClipFillType = ClipperLib2.PolyFillType.pftEvenOdd;
          this.m_SubjFillType = ClipperLib2.PolyFillType.pftEvenOdd;
          this.m_Joins = null;
          this.m_GhostJoins = null;
          this.m_UsingPolyTree = false;
          this.ReverseSolution = false;
          this.StrictlySimple = false;
          ClipperLib2.ClipperBase.call(this);
          this.m_Scanbeam = null;
          this.m_Maxima = null;
          this.m_ActiveEdges = null;
          this.m_SortedEdges = null;
          this.m_IntersectList = new Array();
          this.m_IntersectNodeComparer = ClipperLib2.MyIntersectNodeSort.Compare;
          this.m_ExecuteLocked = false;
          this.m_UsingPolyTree = false;
          this.m_PolyOuts = new Array();
          this.m_Joins = new Array();
          this.m_GhostJoins = new Array();
          this.ReverseSolution = (1 & InitOptions) !== 0;
          this.StrictlySimple = (2 & InitOptions) !== 0;
          this.PreserveCollinear = (4 & InitOptions) !== 0;
          if (ClipperLib2.use_xyz) {
            this.ZFillFunction = null;
          }
        };
        ClipperLib2.Clipper.ioReverseSolution = 1;
        ClipperLib2.Clipper.ioStrictlySimple = 2;
        ClipperLib2.Clipper.ioPreserveCollinear = 4;
        ClipperLib2.Clipper.prototype.Clear = function() {
          if (this.m_edges.length === 0)
            return;
          this.DisposeAllPolyPts();
          ClipperLib2.ClipperBase.prototype.Clear.call(this);
        };
        ClipperLib2.Clipper.prototype.InsertMaxima = function(X) {
          var newMax = new ClipperLib2.Maxima();
          newMax.X = X;
          if (this.m_Maxima === null) {
            this.m_Maxima = newMax;
            this.m_Maxima.Next = null;
            this.m_Maxima.Prev = null;
          } else if (X < this.m_Maxima.X) {
            newMax.Next = this.m_Maxima;
            newMax.Prev = null;
            this.m_Maxima = newMax;
          } else {
            var m = this.m_Maxima;
            while (m.Next !== null && X >= m.Next.X) {
              m = m.Next;
            }
            if (X === m.X) {
              return;
            }
            newMax.Next = m.Next;
            newMax.Prev = m;
            if (m.Next !== null) {
              m.Next.Prev = newMax;
            }
            m.Next = newMax;
          }
        };
        ClipperLib2.Clipper.prototype.Execute = function() {
          var a = arguments, alen = a.length, ispolytree = a[1] instanceof ClipperLib2.PolyTree;
          if (alen === 4 && !ispolytree) {
            var clipType = a[0], solution = a[1], subjFillType = a[2], clipFillType = a[3];
            if (this.m_ExecuteLocked)
              return false;
            if (this.m_HasOpenPaths)
              ClipperLib2.Error("Error: PolyTree struct is needed for open path clipping.");
            this.m_ExecuteLocked = true;
            ClipperLib2.Clear(solution);
            this.m_SubjFillType = subjFillType;
            this.m_ClipFillType = clipFillType;
            this.m_ClipType = clipType;
            this.m_UsingPolyTree = false;
            try {
              var succeeded = this.ExecuteInternal();
              if (succeeded) this.BuildResult(solution);
            } finally {
              this.DisposeAllPolyPts();
              this.m_ExecuteLocked = false;
            }
            return succeeded;
          } else if (alen === 4 && ispolytree) {
            var clipType = a[0], polytree = a[1], subjFillType = a[2], clipFillType = a[3];
            if (this.m_ExecuteLocked)
              return false;
            this.m_ExecuteLocked = true;
            this.m_SubjFillType = subjFillType;
            this.m_ClipFillType = clipFillType;
            this.m_ClipType = clipType;
            this.m_UsingPolyTree = true;
            try {
              var succeeded = this.ExecuteInternal();
              if (succeeded) this.BuildResult2(polytree);
            } finally {
              this.DisposeAllPolyPts();
              this.m_ExecuteLocked = false;
            }
            return succeeded;
          } else if (alen === 2 && !ispolytree) {
            var clipType = a[0], solution = a[1];
            return this.Execute(clipType, solution, ClipperLib2.PolyFillType.pftEvenOdd, ClipperLib2.PolyFillType.pftEvenOdd);
          } else if (alen === 2 && ispolytree) {
            var clipType = a[0], polytree = a[1];
            return this.Execute(clipType, polytree, ClipperLib2.PolyFillType.pftEvenOdd, ClipperLib2.PolyFillType.pftEvenOdd);
          }
        };
        ClipperLib2.Clipper.prototype.FixHoleLinkage = function(outRec) {
          if (outRec.FirstLeft === null || outRec.IsHole !== outRec.FirstLeft.IsHole && outRec.FirstLeft.Pts !== null)
            return;
          var orfl = outRec.FirstLeft;
          while (orfl !== null && (orfl.IsHole === outRec.IsHole || orfl.Pts === null))
            orfl = orfl.FirstLeft;
          outRec.FirstLeft = orfl;
        };
        ClipperLib2.Clipper.prototype.ExecuteInternal = function() {
          try {
            this.Reset();
            this.m_SortedEdges = null;
            this.m_Maxima = null;
            var botY = {}, topY = {};
            if (!this.PopScanbeam(botY)) {
              return false;
            }
            this.InsertLocalMinimaIntoAEL(botY.v);
            while (this.PopScanbeam(topY) || this.LocalMinimaPending()) {
              this.ProcessHorizontals();
              this.m_GhostJoins.length = 0;
              if (!this.ProcessIntersections(topY.v)) {
                return false;
              }
              this.ProcessEdgesAtTopOfScanbeam(topY.v);
              botY.v = topY.v;
              this.InsertLocalMinimaIntoAEL(botY.v);
            }
            var outRec, i, ilen;
            for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
              outRec = this.m_PolyOuts[i];
              if (outRec.Pts === null || outRec.IsOpen) continue;
              if ((outRec.IsHole ^ this.ReverseSolution) == this.Area$1(outRec) > 0)
                this.ReversePolyPtLinks(outRec.Pts);
            }
            this.JoinCommonEdges();
            for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
              outRec = this.m_PolyOuts[i];
              if (outRec.Pts === null)
                continue;
              else if (outRec.IsOpen)
                this.FixupOutPolyline(outRec);
              else
                this.FixupOutPolygon(outRec);
            }
            if (this.StrictlySimple) this.DoSimplePolygons();
            return true;
          } finally {
            this.m_Joins.length = 0;
            this.m_GhostJoins.length = 0;
          }
        };
        ClipperLib2.Clipper.prototype.DisposeAllPolyPts = function() {
          for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; ++i)
            this.DisposeOutRec(i);
          ClipperLib2.Clear(this.m_PolyOuts);
        };
        ClipperLib2.Clipper.prototype.AddJoin = function(Op1, Op2, OffPt) {
          var j = new ClipperLib2.Join();
          j.OutPt1 = Op1;
          j.OutPt2 = Op2;
          j.OffPt.X = OffPt.X;
          j.OffPt.Y = OffPt.Y;
          if (ClipperLib2.use_xyz) j.OffPt.Z = OffPt.Z;
          this.m_Joins.push(j);
        };
        ClipperLib2.Clipper.prototype.AddGhostJoin = function(Op, OffPt) {
          var j = new ClipperLib2.Join();
          j.OutPt1 = Op;
          j.OffPt.X = OffPt.X;
          j.OffPt.Y = OffPt.Y;
          if (ClipperLib2.use_xyz) j.OffPt.Z = OffPt.Z;
          this.m_GhostJoins.push(j);
        };
        ClipperLib2.Clipper.prototype.SetZ = function(pt3, e1, e2) {
          if (this.ZFillFunction !== null) {
            if (pt3.Z !== 0 || this.ZFillFunction === null) return;
            else if (ClipperLib2.IntPoint.op_Equality(pt3, e1.Bot)) pt3.Z = e1.Bot.Z;
            else if (ClipperLib2.IntPoint.op_Equality(pt3, e1.Top)) pt3.Z = e1.Top.Z;
            else if (ClipperLib2.IntPoint.op_Equality(pt3, e2.Bot)) pt3.Z = e2.Bot.Z;
            else if (ClipperLib2.IntPoint.op_Equality(pt3, e2.Top)) pt3.Z = e2.Top.Z;
            else this.ZFillFunction(e1.Bot, e1.Top, e2.Bot, e2.Top, pt3);
          }
        };
        ClipperLib2.Clipper.prototype.InsertLocalMinimaIntoAEL = function(botY) {
          var lm = {};
          var lb;
          var rb;
          while (this.PopLocalMinima(botY, lm)) {
            lb = lm.v.LeftBound;
            rb = lm.v.RightBound;
            var Op1 = null;
            if (lb === null) {
              this.InsertEdgeIntoAEL(rb, null);
              this.SetWindingCount(rb);
              if (this.IsContributing(rb))
                Op1 = this.AddOutPt(rb, rb.Bot);
            } else if (rb === null) {
              this.InsertEdgeIntoAEL(lb, null);
              this.SetWindingCount(lb);
              if (this.IsContributing(lb))
                Op1 = this.AddOutPt(lb, lb.Bot);
              this.InsertScanbeam(lb.Top.Y);
            } else {
              this.InsertEdgeIntoAEL(lb, null);
              this.InsertEdgeIntoAEL(rb, lb);
              this.SetWindingCount(lb);
              rb.WindCnt = lb.WindCnt;
              rb.WindCnt2 = lb.WindCnt2;
              if (this.IsContributing(lb))
                Op1 = this.AddLocalMinPoly(lb, rb, lb.Bot);
              this.InsertScanbeam(lb.Top.Y);
            }
            if (rb !== null) {
              if (ClipperLib2.ClipperBase.IsHorizontal(rb)) {
                if (rb.NextInLML !== null) {
                  this.InsertScanbeam(rb.NextInLML.Top.Y);
                }
                this.AddEdgeToSEL(rb);
              } else {
                this.InsertScanbeam(rb.Top.Y);
              }
            }
            if (lb === null || rb === null) continue;
            if (Op1 !== null && ClipperLib2.ClipperBase.IsHorizontal(rb) && this.m_GhostJoins.length > 0 && rb.WindDelta !== 0) {
              for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; i++) {
                var j = this.m_GhostJoins[i];
                if (this.HorzSegmentsOverlap(j.OutPt1.Pt.X, j.OffPt.X, rb.Bot.X, rb.Top.X))
                  this.AddJoin(j.OutPt1, Op1, j.OffPt);
              }
            }
            if (lb.OutIdx >= 0 && lb.PrevInAEL !== null && lb.PrevInAEL.Curr.X === lb.Bot.X && lb.PrevInAEL.OutIdx >= 0 && ClipperLib2.ClipperBase.SlopesEqual5(lb.PrevInAEL.Curr, lb.PrevInAEL.Top, lb.Curr, lb.Top, this.m_UseFullRange) && lb.WindDelta !== 0 && lb.PrevInAEL.WindDelta !== 0) {
              var Op2 = this.AddOutPt(lb.PrevInAEL, lb.Bot);
              this.AddJoin(Op1, Op2, lb.Top);
            }
            if (lb.NextInAEL !== rb) {
              if (rb.OutIdx >= 0 && rb.PrevInAEL.OutIdx >= 0 && ClipperLib2.ClipperBase.SlopesEqual5(rb.PrevInAEL.Curr, rb.PrevInAEL.Top, rb.Curr, rb.Top, this.m_UseFullRange) && rb.WindDelta !== 0 && rb.PrevInAEL.WindDelta !== 0) {
                var Op2 = this.AddOutPt(rb.PrevInAEL, rb.Bot);
                this.AddJoin(Op1, Op2, rb.Top);
              }
              var e = lb.NextInAEL;
              if (e !== null)
                while (e !== rb) {
                  this.IntersectEdges(rb, e, lb.Curr);
                  e = e.NextInAEL;
                }
            }
          }
        };
        ClipperLib2.Clipper.prototype.InsertEdgeIntoAEL = function(edge, startEdge) {
          if (this.m_ActiveEdges === null) {
            edge.PrevInAEL = null;
            edge.NextInAEL = null;
            this.m_ActiveEdges = edge;
          } else if (startEdge === null && this.E2InsertsBeforeE1(this.m_ActiveEdges, edge)) {
            edge.PrevInAEL = null;
            edge.NextInAEL = this.m_ActiveEdges;
            this.m_ActiveEdges.PrevInAEL = edge;
            this.m_ActiveEdges = edge;
          } else {
            if (startEdge === null)
              startEdge = this.m_ActiveEdges;
            while (startEdge.NextInAEL !== null && !this.E2InsertsBeforeE1(startEdge.NextInAEL, edge))
              startEdge = startEdge.NextInAEL;
            edge.NextInAEL = startEdge.NextInAEL;
            if (startEdge.NextInAEL !== null)
              startEdge.NextInAEL.PrevInAEL = edge;
            edge.PrevInAEL = startEdge;
            startEdge.NextInAEL = edge;
          }
        };
        ClipperLib2.Clipper.prototype.E2InsertsBeforeE1 = function(e1, e2) {
          if (e2.Curr.X === e1.Curr.X) {
            if (e2.Top.Y > e1.Top.Y)
              return e2.Top.X < ClipperLib2.Clipper.TopX(e1, e2.Top.Y);
            else
              return e1.Top.X > ClipperLib2.Clipper.TopX(e2, e1.Top.Y);
          } else
            return e2.Curr.X < e1.Curr.X;
        };
        ClipperLib2.Clipper.prototype.IsEvenOddFillType = function(edge) {
          if (edge.PolyTyp === ClipperLib2.PolyType.ptSubject)
            return this.m_SubjFillType === ClipperLib2.PolyFillType.pftEvenOdd;
          else
            return this.m_ClipFillType === ClipperLib2.PolyFillType.pftEvenOdd;
        };
        ClipperLib2.Clipper.prototype.IsEvenOddAltFillType = function(edge) {
          if (edge.PolyTyp === ClipperLib2.PolyType.ptSubject)
            return this.m_ClipFillType === ClipperLib2.PolyFillType.pftEvenOdd;
          else
            return this.m_SubjFillType === ClipperLib2.PolyFillType.pftEvenOdd;
        };
        ClipperLib2.Clipper.prototype.IsContributing = function(edge) {
          var pft, pft2;
          if (edge.PolyTyp === ClipperLib2.PolyType.ptSubject) {
            pft = this.m_SubjFillType;
            pft2 = this.m_ClipFillType;
          } else {
            pft = this.m_ClipFillType;
            pft2 = this.m_SubjFillType;
          }
          switch (pft) {
            case ClipperLib2.PolyFillType.pftEvenOdd:
              if (edge.WindDelta === 0 && edge.WindCnt !== 1)
                return false;
              break;
            case ClipperLib2.PolyFillType.pftNonZero:
              if (Math.abs(edge.WindCnt) !== 1)
                return false;
              break;
            case ClipperLib2.PolyFillType.pftPositive:
              if (edge.WindCnt !== 1)
                return false;
              break;
            default:
              if (edge.WindCnt !== -1)
                return false;
              break;
          }
          switch (this.m_ClipType) {
            case ClipperLib2.ClipType.ctIntersection:
              switch (pft2) {
                case ClipperLib2.PolyFillType.pftEvenOdd:
                case ClipperLib2.PolyFillType.pftNonZero:
                  return edge.WindCnt2 !== 0;
                case ClipperLib2.PolyFillType.pftPositive:
                  return edge.WindCnt2 > 0;
                default:
                  return edge.WindCnt2 < 0;
              }
            case ClipperLib2.ClipType.ctUnion:
              switch (pft2) {
                case ClipperLib2.PolyFillType.pftEvenOdd:
                case ClipperLib2.PolyFillType.pftNonZero:
                  return edge.WindCnt2 === 0;
                case ClipperLib2.PolyFillType.pftPositive:
                  return edge.WindCnt2 <= 0;
                default:
                  return edge.WindCnt2 >= 0;
              }
            case ClipperLib2.ClipType.ctDifference:
              if (edge.PolyTyp === ClipperLib2.PolyType.ptSubject)
                switch (pft2) {
                  case ClipperLib2.PolyFillType.pftEvenOdd:
                  case ClipperLib2.PolyFillType.pftNonZero:
                    return edge.WindCnt2 === 0;
                  case ClipperLib2.PolyFillType.pftPositive:
                    return edge.WindCnt2 <= 0;
                  default:
                    return edge.WindCnt2 >= 0;
                }
              else
                switch (pft2) {
                  case ClipperLib2.PolyFillType.pftEvenOdd:
                  case ClipperLib2.PolyFillType.pftNonZero:
                    return edge.WindCnt2 !== 0;
                  case ClipperLib2.PolyFillType.pftPositive:
                    return edge.WindCnt2 > 0;
                  default:
                    return edge.WindCnt2 < 0;
                }
            case ClipperLib2.ClipType.ctXor:
              if (edge.WindDelta === 0)
                switch (pft2) {
                  case ClipperLib2.PolyFillType.pftEvenOdd:
                  case ClipperLib2.PolyFillType.pftNonZero:
                    return edge.WindCnt2 === 0;
                  case ClipperLib2.PolyFillType.pftPositive:
                    return edge.WindCnt2 <= 0;
                  default:
                    return edge.WindCnt2 >= 0;
                }
              else
                return true;
          }
          return true;
        };
        ClipperLib2.Clipper.prototype.SetWindingCount = function(edge) {
          var e = edge.PrevInAEL;
          while (e !== null && (e.PolyTyp !== edge.PolyTyp || e.WindDelta === 0))
            e = e.PrevInAEL;
          if (e === null) {
            var pft = edge.PolyTyp === ClipperLib2.PolyType.ptSubject ? this.m_SubjFillType : this.m_ClipFillType;
            if (edge.WindDelta === 0) {
              edge.WindCnt = pft === ClipperLib2.PolyFillType.pftNegative ? -1 : 1;
            } else {
              edge.WindCnt = edge.WindDelta;
            }
            edge.WindCnt2 = 0;
            e = this.m_ActiveEdges;
          } else if (edge.WindDelta === 0 && this.m_ClipType !== ClipperLib2.ClipType.ctUnion) {
            edge.WindCnt = 1;
            edge.WindCnt2 = e.WindCnt2;
            e = e.NextInAEL;
          } else if (this.IsEvenOddFillType(edge)) {
            if (edge.WindDelta === 0) {
              var Inside = true;
              var e2 = e.PrevInAEL;
              while (e2 !== null) {
                if (e2.PolyTyp === e.PolyTyp && e2.WindDelta !== 0)
                  Inside = !Inside;
                e2 = e2.PrevInAEL;
              }
              edge.WindCnt = Inside ? 0 : 1;
            } else {
              edge.WindCnt = edge.WindDelta;
            }
            edge.WindCnt2 = e.WindCnt2;
            e = e.NextInAEL;
          } else {
            if (e.WindCnt * e.WindDelta < 0) {
              if (Math.abs(e.WindCnt) > 1) {
                if (e.WindDelta * edge.WindDelta < 0)
                  edge.WindCnt = e.WindCnt;
                else
                  edge.WindCnt = e.WindCnt + edge.WindDelta;
              } else
                edge.WindCnt = edge.WindDelta === 0 ? 1 : edge.WindDelta;
            } else {
              if (edge.WindDelta === 0)
                edge.WindCnt = e.WindCnt < 0 ? e.WindCnt - 1 : e.WindCnt + 1;
              else if (e.WindDelta * edge.WindDelta < 0)
                edge.WindCnt = e.WindCnt;
              else
                edge.WindCnt = e.WindCnt + edge.WindDelta;
            }
            edge.WindCnt2 = e.WindCnt2;
            e = e.NextInAEL;
          }
          if (this.IsEvenOddAltFillType(edge)) {
            while (e !== edge) {
              if (e.WindDelta !== 0)
                edge.WindCnt2 = edge.WindCnt2 === 0 ? 1 : 0;
              e = e.NextInAEL;
            }
          } else {
            while (e !== edge) {
              edge.WindCnt2 += e.WindDelta;
              e = e.NextInAEL;
            }
          }
        };
        ClipperLib2.Clipper.prototype.AddEdgeToSEL = function(edge) {
          if (this.m_SortedEdges === null) {
            this.m_SortedEdges = edge;
            edge.PrevInSEL = null;
            edge.NextInSEL = null;
          } else {
            edge.NextInSEL = this.m_SortedEdges;
            edge.PrevInSEL = null;
            this.m_SortedEdges.PrevInSEL = edge;
            this.m_SortedEdges = edge;
          }
        };
        ClipperLib2.Clipper.prototype.PopEdgeFromSEL = function(e) {
          e.v = this.m_SortedEdges;
          if (e.v === null) {
            return false;
          }
          var oldE = e.v;
          this.m_SortedEdges = e.v.NextInSEL;
          if (this.m_SortedEdges !== null) {
            this.m_SortedEdges.PrevInSEL = null;
          }
          oldE.NextInSEL = null;
          oldE.PrevInSEL = null;
          return true;
        };
        ClipperLib2.Clipper.prototype.CopyAELToSEL = function() {
          var e = this.m_ActiveEdges;
          this.m_SortedEdges = e;
          while (e !== null) {
            e.PrevInSEL = e.PrevInAEL;
            e.NextInSEL = e.NextInAEL;
            e = e.NextInAEL;
          }
        };
        ClipperLib2.Clipper.prototype.SwapPositionsInSEL = function(edge1, edge2) {
          if (edge1.NextInSEL === null && edge1.PrevInSEL === null)
            return;
          if (edge2.NextInSEL === null && edge2.PrevInSEL === null)
            return;
          if (edge1.NextInSEL === edge2) {
            var next = edge2.NextInSEL;
            if (next !== null)
              next.PrevInSEL = edge1;
            var prev = edge1.PrevInSEL;
            if (prev !== null)
              prev.NextInSEL = edge2;
            edge2.PrevInSEL = prev;
            edge2.NextInSEL = edge1;
            edge1.PrevInSEL = edge2;
            edge1.NextInSEL = next;
          } else if (edge2.NextInSEL === edge1) {
            var next = edge1.NextInSEL;
            if (next !== null)
              next.PrevInSEL = edge2;
            var prev = edge2.PrevInSEL;
            if (prev !== null)
              prev.NextInSEL = edge1;
            edge1.PrevInSEL = prev;
            edge1.NextInSEL = edge2;
            edge2.PrevInSEL = edge1;
            edge2.NextInSEL = next;
          } else {
            var next = edge1.NextInSEL;
            var prev = edge1.PrevInSEL;
            edge1.NextInSEL = edge2.NextInSEL;
            if (edge1.NextInSEL !== null)
              edge1.NextInSEL.PrevInSEL = edge1;
            edge1.PrevInSEL = edge2.PrevInSEL;
            if (edge1.PrevInSEL !== null)
              edge1.PrevInSEL.NextInSEL = edge1;
            edge2.NextInSEL = next;
            if (edge2.NextInSEL !== null)
              edge2.NextInSEL.PrevInSEL = edge2;
            edge2.PrevInSEL = prev;
            if (edge2.PrevInSEL !== null)
              edge2.PrevInSEL.NextInSEL = edge2;
          }
          if (edge1.PrevInSEL === null)
            this.m_SortedEdges = edge1;
          else if (edge2.PrevInSEL === null)
            this.m_SortedEdges = edge2;
        };
        ClipperLib2.Clipper.prototype.AddLocalMaxPoly = function(e1, e2, pt3) {
          this.AddOutPt(e1, pt3);
          if (e2.WindDelta === 0) this.AddOutPt(e2, pt3);
          if (e1.OutIdx === e2.OutIdx) {
            e1.OutIdx = -1;
            e2.OutIdx = -1;
          } else if (e1.OutIdx < e2.OutIdx)
            this.AppendPolygon(e1, e2);
          else
            this.AppendPolygon(e2, e1);
        };
        ClipperLib2.Clipper.prototype.AddLocalMinPoly = function(e1, e2, pt3) {
          var result;
          var e, prevE;
          if (ClipperLib2.ClipperBase.IsHorizontal(e2) || e1.Dx > e2.Dx) {
            result = this.AddOutPt(e1, pt3);
            e2.OutIdx = e1.OutIdx;
            e1.Side = ClipperLib2.EdgeSide.esLeft;
            e2.Side = ClipperLib2.EdgeSide.esRight;
            e = e1;
            if (e.PrevInAEL === e2)
              prevE = e2.PrevInAEL;
            else
              prevE = e.PrevInAEL;
          } else {
            result = this.AddOutPt(e2, pt3);
            e1.OutIdx = e2.OutIdx;
            e1.Side = ClipperLib2.EdgeSide.esRight;
            e2.Side = ClipperLib2.EdgeSide.esLeft;
            e = e2;
            if (e.PrevInAEL === e1)
              prevE = e1.PrevInAEL;
            else
              prevE = e.PrevInAEL;
          }
          if (prevE !== null && prevE.OutIdx >= 0 && prevE.Top.Y < pt3.Y && e.Top.Y < pt3.Y) {
            var xPrev = ClipperLib2.Clipper.TopX(prevE, pt3.Y);
            var xE = ClipperLib2.Clipper.TopX(e, pt3.Y);
            if (xPrev === xE && e.WindDelta !== 0 && prevE.WindDelta !== 0 && ClipperLib2.ClipperBase.SlopesEqual5(new ClipperLib2.IntPoint2(xPrev, pt3.Y), prevE.Top, new ClipperLib2.IntPoint2(xE, pt3.Y), e.Top, this.m_UseFullRange)) {
              var outPt = this.AddOutPt(prevE, pt3);
              this.AddJoin(result, outPt, e.Top);
            }
          }
          return result;
        };
        ClipperLib2.Clipper.prototype.AddOutPt = function(e, pt3) {
          if (e.OutIdx < 0) {
            var outRec = this.CreateOutRec();
            outRec.IsOpen = e.WindDelta === 0;
            var newOp = new ClipperLib2.OutPt();
            outRec.Pts = newOp;
            newOp.Idx = outRec.Idx;
            newOp.Pt.X = pt3.X;
            newOp.Pt.Y = pt3.Y;
            if (ClipperLib2.use_xyz) newOp.Pt.Z = pt3.Z;
            newOp.Next = newOp;
            newOp.Prev = newOp;
            if (!outRec.IsOpen)
              this.SetHoleState(e, outRec);
            e.OutIdx = outRec.Idx;
            return newOp;
          } else {
            var outRec = this.m_PolyOuts[e.OutIdx];
            var op = outRec.Pts;
            var ToFront = e.Side === ClipperLib2.EdgeSide.esLeft;
            if (ToFront && ClipperLib2.IntPoint.op_Equality(pt3, op.Pt))
              return op;
            else if (!ToFront && ClipperLib2.IntPoint.op_Equality(pt3, op.Prev.Pt))
              return op.Prev;
            var newOp = new ClipperLib2.OutPt();
            newOp.Idx = outRec.Idx;
            newOp.Pt.X = pt3.X;
            newOp.Pt.Y = pt3.Y;
            if (ClipperLib2.use_xyz) newOp.Pt.Z = pt3.Z;
            newOp.Next = op;
            newOp.Prev = op.Prev;
            newOp.Prev.Next = newOp;
            op.Prev = newOp;
            if (ToFront)
              outRec.Pts = newOp;
            return newOp;
          }
        };
        ClipperLib2.Clipper.prototype.GetLastOutPt = function(e) {
          var outRec = this.m_PolyOuts[e.OutIdx];
          if (e.Side === ClipperLib2.EdgeSide.esLeft) {
            return outRec.Pts;
          } else {
            return outRec.Pts.Prev;
          }
        };
        ClipperLib2.Clipper.prototype.SwapPoints = function(pt1, pt22) {
          var tmp = new ClipperLib2.IntPoint1(pt1.Value);
          pt1.Value.X = pt22.Value.X;
          pt1.Value.Y = pt22.Value.Y;
          if (ClipperLib2.use_xyz) pt1.Value.Z = pt22.Value.Z;
          pt22.Value.X = tmp.X;
          pt22.Value.Y = tmp.Y;
          if (ClipperLib2.use_xyz) pt22.Value.Z = tmp.Z;
        };
        ClipperLib2.Clipper.prototype.HorzSegmentsOverlap = function(seg1a, seg1b, seg2a, seg2b) {
          var tmp;
          if (seg1a > seg1b) {
            tmp = seg1a;
            seg1a = seg1b;
            seg1b = tmp;
          }
          if (seg2a > seg2b) {
            tmp = seg2a;
            seg2a = seg2b;
            seg2b = tmp;
          }
          return seg1a < seg2b && seg2a < seg1b;
        };
        ClipperLib2.Clipper.prototype.SetHoleState = function(e, outRec) {
          var e2 = e.PrevInAEL;
          var eTmp = null;
          while (e2 !== null) {
            if (e2.OutIdx >= 0 && e2.WindDelta !== 0) {
              if (eTmp === null)
                eTmp = e2;
              else if (eTmp.OutIdx === e2.OutIdx)
                eTmp = null;
            }
            e2 = e2.PrevInAEL;
          }
          if (eTmp === null) {
            outRec.FirstLeft = null;
            outRec.IsHole = false;
          } else {
            outRec.FirstLeft = this.m_PolyOuts[eTmp.OutIdx];
            outRec.IsHole = !outRec.FirstLeft.IsHole;
          }
        };
        ClipperLib2.Clipper.prototype.GetDx = function(pt1, pt22) {
          if (pt1.Y === pt22.Y)
            return ClipperLib2.ClipperBase.horizontal;
          else
            return (pt22.X - pt1.X) / (pt22.Y - pt1.Y);
        };
        ClipperLib2.Clipper.prototype.FirstIsBottomPt = function(btmPt1, btmPt2) {
          var p = btmPt1.Prev;
          while (ClipperLib2.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1)
            p = p.Prev;
          var dx1p = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
          p = btmPt1.Next;
          while (ClipperLib2.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1)
            p = p.Next;
          var dx1n = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
          p = btmPt2.Prev;
          while (ClipperLib2.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2)
            p = p.Prev;
          var dx2p = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
          p = btmPt2.Next;
          while (ClipperLib2.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2)
            p = p.Next;
          var dx2n = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
          if (Math.max(dx1p, dx1n) === Math.max(dx2p, dx2n) && Math.min(dx1p, dx1n) === Math.min(dx2p, dx2n)) {
            return this.Area(btmPt1) > 0;
          } else {
            return dx1p >= dx2p && dx1p >= dx2n || dx1n >= dx2p && dx1n >= dx2n;
          }
        };
        ClipperLib2.Clipper.prototype.GetBottomPt = function(pp) {
          var dups = null;
          var p = pp.Next;
          while (p !== pp) {
            if (p.Pt.Y > pp.Pt.Y) {
              pp = p;
              dups = null;
            } else if (p.Pt.Y === pp.Pt.Y && p.Pt.X <= pp.Pt.X) {
              if (p.Pt.X < pp.Pt.X) {
                dups = null;
                pp = p;
              } else {
                if (p.Next !== pp && p.Prev !== pp)
                  dups = p;
              }
            }
            p = p.Next;
          }
          if (dups !== null) {
            while (dups !== p) {
              if (!this.FirstIsBottomPt(p, dups))
                pp = dups;
              dups = dups.Next;
              while (ClipperLib2.IntPoint.op_Inequality(dups.Pt, pp.Pt))
                dups = dups.Next;
            }
          }
          return pp;
        };
        ClipperLib2.Clipper.prototype.GetLowermostRec = function(outRec1, outRec2) {
          if (outRec1.BottomPt === null)
            outRec1.BottomPt = this.GetBottomPt(outRec1.Pts);
          if (outRec2.BottomPt === null)
            outRec2.BottomPt = this.GetBottomPt(outRec2.Pts);
          var bPt1 = outRec1.BottomPt;
          var bPt2 = outRec2.BottomPt;
          if (bPt1.Pt.Y > bPt2.Pt.Y)
            return outRec1;
          else if (bPt1.Pt.Y < bPt2.Pt.Y)
            return outRec2;
          else if (bPt1.Pt.X < bPt2.Pt.X)
            return outRec1;
          else if (bPt1.Pt.X > bPt2.Pt.X)
            return outRec2;
          else if (bPt1.Next === bPt1)
            return outRec2;
          else if (bPt2.Next === bPt2)
            return outRec1;
          else if (this.FirstIsBottomPt(bPt1, bPt2))
            return outRec1;
          else
            return outRec2;
        };
        ClipperLib2.Clipper.prototype.OutRec1RightOfOutRec2 = function(outRec1, outRec2) {
          do {
            outRec1 = outRec1.FirstLeft;
            if (outRec1 === outRec2)
              return true;
          } while (outRec1 !== null);
          return false;
        };
        ClipperLib2.Clipper.prototype.GetOutRec = function(idx) {
          var outrec = this.m_PolyOuts[idx];
          while (outrec !== this.m_PolyOuts[outrec.Idx])
            outrec = this.m_PolyOuts[outrec.Idx];
          return outrec;
        };
        ClipperLib2.Clipper.prototype.AppendPolygon = function(e1, e2) {
          var outRec1 = this.m_PolyOuts[e1.OutIdx];
          var outRec2 = this.m_PolyOuts[e2.OutIdx];
          var holeStateRec;
          if (this.OutRec1RightOfOutRec2(outRec1, outRec2))
            holeStateRec = outRec2;
          else if (this.OutRec1RightOfOutRec2(outRec2, outRec1))
            holeStateRec = outRec1;
          else
            holeStateRec = this.GetLowermostRec(outRec1, outRec2);
          var p1_lft = outRec1.Pts;
          var p1_rt = p1_lft.Prev;
          var p2_lft = outRec2.Pts;
          var p2_rt = p2_lft.Prev;
          if (e1.Side === ClipperLib2.EdgeSide.esLeft) {
            if (e2.Side === ClipperLib2.EdgeSide.esLeft) {
              this.ReversePolyPtLinks(p2_lft);
              p2_lft.Next = p1_lft;
              p1_lft.Prev = p2_lft;
              p1_rt.Next = p2_rt;
              p2_rt.Prev = p1_rt;
              outRec1.Pts = p2_rt;
            } else {
              p2_rt.Next = p1_lft;
              p1_lft.Prev = p2_rt;
              p2_lft.Prev = p1_rt;
              p1_rt.Next = p2_lft;
              outRec1.Pts = p2_lft;
            }
          } else {
            if (e2.Side === ClipperLib2.EdgeSide.esRight) {
              this.ReversePolyPtLinks(p2_lft);
              p1_rt.Next = p2_rt;
              p2_rt.Prev = p1_rt;
              p2_lft.Next = p1_lft;
              p1_lft.Prev = p2_lft;
            } else {
              p1_rt.Next = p2_lft;
              p2_lft.Prev = p1_rt;
              p1_lft.Prev = p2_rt;
              p2_rt.Next = p1_lft;
            }
          }
          outRec1.BottomPt = null;
          if (holeStateRec === outRec2) {
            if (outRec2.FirstLeft !== outRec1)
              outRec1.FirstLeft = outRec2.FirstLeft;
            outRec1.IsHole = outRec2.IsHole;
          }
          outRec2.Pts = null;
          outRec2.BottomPt = null;
          outRec2.FirstLeft = outRec1;
          var OKIdx = e1.OutIdx;
          var ObsoleteIdx = e2.OutIdx;
          e1.OutIdx = -1;
          e2.OutIdx = -1;
          var e = this.m_ActiveEdges;
          while (e !== null) {
            if (e.OutIdx === ObsoleteIdx) {
              e.OutIdx = OKIdx;
              e.Side = e1.Side;
              break;
            }
            e = e.NextInAEL;
          }
          outRec2.Idx = outRec1.Idx;
        };
        ClipperLib2.Clipper.prototype.ReversePolyPtLinks = function(pp) {
          if (pp === null)
            return;
          var pp1;
          var pp2;
          pp1 = pp;
          do {
            pp2 = pp1.Next;
            pp1.Next = pp1.Prev;
            pp1.Prev = pp2;
            pp1 = pp2;
          } while (pp1 !== pp);
        };
        ClipperLib2.Clipper.SwapSides = function(edge1, edge2) {
          var side = edge1.Side;
          edge1.Side = edge2.Side;
          edge2.Side = side;
        };
        ClipperLib2.Clipper.SwapPolyIndexes = function(edge1, edge2) {
          var outIdx = edge1.OutIdx;
          edge1.OutIdx = edge2.OutIdx;
          edge2.OutIdx = outIdx;
        };
        ClipperLib2.Clipper.prototype.IntersectEdges = function(e1, e2, pt3) {
          var e1Contributing = e1.OutIdx >= 0;
          var e2Contributing = e2.OutIdx >= 0;
          if (ClipperLib2.use_xyz)
            this.SetZ(pt3, e1, e2);
          if (ClipperLib2.use_lines) {
            if (e1.WindDelta === 0 || e2.WindDelta === 0) {
              if (e1.WindDelta === 0 && e2.WindDelta === 0) return;
              else if (e1.PolyTyp === e2.PolyTyp && e1.WindDelta !== e2.WindDelta && this.m_ClipType === ClipperLib2.ClipType.ctUnion) {
                if (e1.WindDelta === 0) {
                  if (e2Contributing) {
                    this.AddOutPt(e1, pt3);
                    if (e1Contributing)
                      e1.OutIdx = -1;
                  }
                } else {
                  if (e1Contributing) {
                    this.AddOutPt(e2, pt3);
                    if (e2Contributing)
                      e2.OutIdx = -1;
                  }
                }
              } else if (e1.PolyTyp !== e2.PolyTyp) {
                if (e1.WindDelta === 0 && Math.abs(e2.WindCnt) === 1 && (this.m_ClipType !== ClipperLib2.ClipType.ctUnion || e2.WindCnt2 === 0)) {
                  this.AddOutPt(e1, pt3);
                  if (e1Contributing)
                    e1.OutIdx = -1;
                } else if (e2.WindDelta === 0 && Math.abs(e1.WindCnt) === 1 && (this.m_ClipType !== ClipperLib2.ClipType.ctUnion || e1.WindCnt2 === 0)) {
                  this.AddOutPt(e2, pt3);
                  if (e2Contributing)
                    e2.OutIdx = -1;
                }
              }
              return;
            }
          }
          if (e1.PolyTyp === e2.PolyTyp) {
            if (this.IsEvenOddFillType(e1)) {
              var oldE1WindCnt = e1.WindCnt;
              e1.WindCnt = e2.WindCnt;
              e2.WindCnt = oldE1WindCnt;
            } else {
              if (e1.WindCnt + e2.WindDelta === 0)
                e1.WindCnt = -e1.WindCnt;
              else
                e1.WindCnt += e2.WindDelta;
              if (e2.WindCnt - e1.WindDelta === 0)
                e2.WindCnt = -e2.WindCnt;
              else
                e2.WindCnt -= e1.WindDelta;
            }
          } else {
            if (!this.IsEvenOddFillType(e2))
              e1.WindCnt2 += e2.WindDelta;
            else
              e1.WindCnt2 = e1.WindCnt2 === 0 ? 1 : 0;
            if (!this.IsEvenOddFillType(e1))
              e2.WindCnt2 -= e1.WindDelta;
            else
              e2.WindCnt2 = e2.WindCnt2 === 0 ? 1 : 0;
          }
          var e1FillType, e2FillType, e1FillType2, e2FillType2;
          if (e1.PolyTyp === ClipperLib2.PolyType.ptSubject) {
            e1FillType = this.m_SubjFillType;
            e1FillType2 = this.m_ClipFillType;
          } else {
            e1FillType = this.m_ClipFillType;
            e1FillType2 = this.m_SubjFillType;
          }
          if (e2.PolyTyp === ClipperLib2.PolyType.ptSubject) {
            e2FillType = this.m_SubjFillType;
            e2FillType2 = this.m_ClipFillType;
          } else {
            e2FillType = this.m_ClipFillType;
            e2FillType2 = this.m_SubjFillType;
          }
          var e1Wc, e2Wc;
          switch (e1FillType) {
            case ClipperLib2.PolyFillType.pftPositive:
              e1Wc = e1.WindCnt;
              break;
            case ClipperLib2.PolyFillType.pftNegative:
              e1Wc = -e1.WindCnt;
              break;
            default:
              e1Wc = Math.abs(e1.WindCnt);
              break;
          }
          switch (e2FillType) {
            case ClipperLib2.PolyFillType.pftPositive:
              e2Wc = e2.WindCnt;
              break;
            case ClipperLib2.PolyFillType.pftNegative:
              e2Wc = -e2.WindCnt;
              break;
            default:
              e2Wc = Math.abs(e2.WindCnt);
              break;
          }
          if (e1Contributing && e2Contributing) {
            if (e1Wc !== 0 && e1Wc !== 1 || e2Wc !== 0 && e2Wc !== 1 || e1.PolyTyp !== e2.PolyTyp && this.m_ClipType !== ClipperLib2.ClipType.ctXor) {
              this.AddLocalMaxPoly(e1, e2, pt3);
            } else {
              this.AddOutPt(e1, pt3);
              this.AddOutPt(e2, pt3);
              ClipperLib2.Clipper.SwapSides(e1, e2);
              ClipperLib2.Clipper.SwapPolyIndexes(e1, e2);
            }
          } else if (e1Contributing) {
            if (e2Wc === 0 || e2Wc === 1) {
              this.AddOutPt(e1, pt3);
              ClipperLib2.Clipper.SwapSides(e1, e2);
              ClipperLib2.Clipper.SwapPolyIndexes(e1, e2);
            }
          } else if (e2Contributing) {
            if (e1Wc === 0 || e1Wc === 1) {
              this.AddOutPt(e2, pt3);
              ClipperLib2.Clipper.SwapSides(e1, e2);
              ClipperLib2.Clipper.SwapPolyIndexes(e1, e2);
            }
          } else if ((e1Wc === 0 || e1Wc === 1) && (e2Wc === 0 || e2Wc === 1)) {
            var e1Wc2, e2Wc2;
            switch (e1FillType2) {
              case ClipperLib2.PolyFillType.pftPositive:
                e1Wc2 = e1.WindCnt2;
                break;
              case ClipperLib2.PolyFillType.pftNegative:
                e1Wc2 = -e1.WindCnt2;
                break;
              default:
                e1Wc2 = Math.abs(e1.WindCnt2);
                break;
            }
            switch (e2FillType2) {
              case ClipperLib2.PolyFillType.pftPositive:
                e2Wc2 = e2.WindCnt2;
                break;
              case ClipperLib2.PolyFillType.pftNegative:
                e2Wc2 = -e2.WindCnt2;
                break;
              default:
                e2Wc2 = Math.abs(e2.WindCnt2);
                break;
            }
            if (e1.PolyTyp !== e2.PolyTyp) {
              this.AddLocalMinPoly(e1, e2, pt3);
            } else if (e1Wc === 1 && e2Wc === 1)
              switch (this.m_ClipType) {
                case ClipperLib2.ClipType.ctIntersection:
                  if (e1Wc2 > 0 && e2Wc2 > 0)
                    this.AddLocalMinPoly(e1, e2, pt3);
                  break;
                case ClipperLib2.ClipType.ctUnion:
                  if (e1Wc2 <= 0 && e2Wc2 <= 0)
                    this.AddLocalMinPoly(e1, e2, pt3);
                  break;
                case ClipperLib2.ClipType.ctDifference:
                  if (e1.PolyTyp === ClipperLib2.PolyType.ptClip && e1Wc2 > 0 && e2Wc2 > 0 || e1.PolyTyp === ClipperLib2.PolyType.ptSubject && e1Wc2 <= 0 && e2Wc2 <= 0)
                    this.AddLocalMinPoly(e1, e2, pt3);
                  break;
                case ClipperLib2.ClipType.ctXor:
                  this.AddLocalMinPoly(e1, e2, pt3);
                  break;
              }
            else
              ClipperLib2.Clipper.SwapSides(e1, e2);
          }
        };
        ClipperLib2.Clipper.prototype.DeleteFromSEL = function(e) {
          var SelPrev = e.PrevInSEL;
          var SelNext = e.NextInSEL;
          if (SelPrev === null && SelNext === null && e !== this.m_SortedEdges)
            return;
          if (SelPrev !== null)
            SelPrev.NextInSEL = SelNext;
          else
            this.m_SortedEdges = SelNext;
          if (SelNext !== null)
            SelNext.PrevInSEL = SelPrev;
          e.NextInSEL = null;
          e.PrevInSEL = null;
        };
        ClipperLib2.Clipper.prototype.ProcessHorizontals = function() {
          var horzEdge = {};
          while (this.PopEdgeFromSEL(horzEdge)) {
            this.ProcessHorizontal(horzEdge.v);
          }
        };
        ClipperLib2.Clipper.prototype.GetHorzDirection = function(HorzEdge, $var) {
          if (HorzEdge.Bot.X < HorzEdge.Top.X) {
            $var.Left = HorzEdge.Bot.X;
            $var.Right = HorzEdge.Top.X;
            $var.Dir = ClipperLib2.Direction.dLeftToRight;
          } else {
            $var.Left = HorzEdge.Top.X;
            $var.Right = HorzEdge.Bot.X;
            $var.Dir = ClipperLib2.Direction.dRightToLeft;
          }
        };
        ClipperLib2.Clipper.prototype.ProcessHorizontal = function(horzEdge) {
          var $var = {
            Dir: null,
            Left: null,
            Right: null
          };
          this.GetHorzDirection(horzEdge, $var);
          var dir = $var.Dir;
          var horzLeft = $var.Left;
          var horzRight = $var.Right;
          var IsOpen = horzEdge.WindDelta === 0;
          var eLastHorz = horzEdge, eMaxPair = null;
          while (eLastHorz.NextInLML !== null && ClipperLib2.ClipperBase.IsHorizontal(eLastHorz.NextInLML))
            eLastHorz = eLastHorz.NextInLML;
          if (eLastHorz.NextInLML === null)
            eMaxPair = this.GetMaximaPair(eLastHorz);
          var currMax = this.m_Maxima;
          if (currMax !== null) {
            if (dir === ClipperLib2.Direction.dLeftToRight) {
              while (currMax !== null && currMax.X <= horzEdge.Bot.X) {
                currMax = currMax.Next;
              }
              if (currMax !== null && currMax.X >= eLastHorz.Top.X) {
                currMax = null;
              }
            } else {
              while (currMax.Next !== null && currMax.Next.X < horzEdge.Bot.X) {
                currMax = currMax.Next;
              }
              if (currMax.X <= eLastHorz.Top.X) {
                currMax = null;
              }
            }
          }
          var op1 = null;
          for (; ; ) {
            var IsLastHorz = horzEdge === eLastHorz;
            var e = this.GetNextInAEL(horzEdge, dir);
            while (e !== null) {
              if (currMax !== null) {
                if (dir === ClipperLib2.Direction.dLeftToRight) {
                  while (currMax !== null && currMax.X < e.Curr.X) {
                    if (horzEdge.OutIdx >= 0 && !IsOpen) {
                      this.AddOutPt(horzEdge, new ClipperLib2.IntPoint2(currMax.X, horzEdge.Bot.Y));
                    }
                    currMax = currMax.Next;
                  }
                } else {
                  while (currMax !== null && currMax.X > e.Curr.X) {
                    if (horzEdge.OutIdx >= 0 && !IsOpen) {
                      this.AddOutPt(horzEdge, new ClipperLib2.IntPoint2(currMax.X, horzEdge.Bot.Y));
                    }
                    currMax = currMax.Prev;
                  }
                }
              }
              if (dir === ClipperLib2.Direction.dLeftToRight && e.Curr.X > horzRight || dir === ClipperLib2.Direction.dRightToLeft && e.Curr.X < horzLeft) {
                break;
              }
              if (e.Curr.X === horzEdge.Top.X && horzEdge.NextInLML !== null && e.Dx < horzEdge.NextInLML.Dx)
                break;
              if (horzEdge.OutIdx >= 0 && !IsOpen) {
                if (ClipperLib2.use_xyz) {
                  if (dir === ClipperLib2.Direction.dLeftToRight)
                    this.SetZ(e.Curr, horzEdge, e);
                  else this.SetZ(e.Curr, e, horzEdge);
                }
                op1 = this.AddOutPt(horzEdge, e.Curr);
                var eNextHorz = this.m_SortedEdges;
                while (eNextHorz !== null) {
                  if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
                    var op2 = this.GetLastOutPt(eNextHorz);
                    this.AddJoin(op2, op1, eNextHorz.Top);
                  }
                  eNextHorz = eNextHorz.NextInSEL;
                }
                this.AddGhostJoin(op1, horzEdge.Bot);
              }
              if (e === eMaxPair && IsLastHorz) {
                if (horzEdge.OutIdx >= 0) {
                  this.AddLocalMaxPoly(horzEdge, eMaxPair, horzEdge.Top);
                }
                this.DeleteFromAEL(horzEdge);
                this.DeleteFromAEL(eMaxPair);
                return;
              }
              if (dir === ClipperLib2.Direction.dLeftToRight) {
                var Pt = new ClipperLib2.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
                this.IntersectEdges(horzEdge, e, Pt);
              } else {
                var Pt = new ClipperLib2.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
                this.IntersectEdges(e, horzEdge, Pt);
              }
              var eNext = this.GetNextInAEL(e, dir);
              this.SwapPositionsInAEL(horzEdge, e);
              e = eNext;
            }
            if (horzEdge.NextInLML === null || !ClipperLib2.ClipperBase.IsHorizontal(horzEdge.NextInLML)) {
              break;
            }
            horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
            if (horzEdge.OutIdx >= 0) {
              this.AddOutPt(horzEdge, horzEdge.Bot);
            }
            $var = {
              Dir: dir,
              Left: horzLeft,
              Right: horzRight
            };
            this.GetHorzDirection(horzEdge, $var);
            dir = $var.Dir;
            horzLeft = $var.Left;
            horzRight = $var.Right;
          }
          if (horzEdge.OutIdx >= 0 && op1 === null) {
            op1 = this.GetLastOutPt(horzEdge);
            var eNextHorz = this.m_SortedEdges;
            while (eNextHorz !== null) {
              if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
                var op2 = this.GetLastOutPt(eNextHorz);
                this.AddJoin(op2, op1, eNextHorz.Top);
              }
              eNextHorz = eNextHorz.NextInSEL;
            }
            this.AddGhostJoin(op1, horzEdge.Top);
          }
          if (horzEdge.NextInLML !== null) {
            if (horzEdge.OutIdx >= 0) {
              op1 = this.AddOutPt(horzEdge, horzEdge.Top);
              horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
              if (horzEdge.WindDelta === 0) {
                return;
              }
              var ePrev = horzEdge.PrevInAEL;
              var eNext = horzEdge.NextInAEL;
              if (ePrev !== null && ePrev.Curr.X === horzEdge.Bot.X && ePrev.Curr.Y === horzEdge.Bot.Y && ePrev.WindDelta === 0 && (ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y && ClipperLib2.ClipperBase.SlopesEqual3(horzEdge, ePrev, this.m_UseFullRange))) {
                var op2 = this.AddOutPt(ePrev, horzEdge.Bot);
                this.AddJoin(op1, op2, horzEdge.Top);
              } else if (eNext !== null && eNext.Curr.X === horzEdge.Bot.X && eNext.Curr.Y === horzEdge.Bot.Y && eNext.WindDelta !== 0 && eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y && ClipperLib2.ClipperBase.SlopesEqual3(horzEdge, eNext, this.m_UseFullRange)) {
                var op2 = this.AddOutPt(eNext, horzEdge.Bot);
                this.AddJoin(op1, op2, horzEdge.Top);
              }
            } else {
              horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
            }
          } else {
            if (horzEdge.OutIdx >= 0) {
              this.AddOutPt(horzEdge, horzEdge.Top);
            }
            this.DeleteFromAEL(horzEdge);
          }
        };
        ClipperLib2.Clipper.prototype.GetNextInAEL = function(e, Direction3) {
          return Direction3 === ClipperLib2.Direction.dLeftToRight ? e.NextInAEL : e.PrevInAEL;
        };
        ClipperLib2.Clipper.prototype.IsMinima = function(e) {
          return e !== null && e.Prev.NextInLML !== e && e.Next.NextInLML !== e;
        };
        ClipperLib2.Clipper.prototype.IsMaxima = function(e, Y) {
          return e !== null && e.Top.Y === Y && e.NextInLML === null;
        };
        ClipperLib2.Clipper.prototype.IsIntermediate = function(e, Y) {
          return e.Top.Y === Y && e.NextInLML !== null;
        };
        ClipperLib2.Clipper.prototype.GetMaximaPair = function(e) {
          if (ClipperLib2.IntPoint.op_Equality(e.Next.Top, e.Top) && e.Next.NextInLML === null) {
            return e.Next;
          } else {
            if (ClipperLib2.IntPoint.op_Equality(e.Prev.Top, e.Top) && e.Prev.NextInLML === null) {
              return e.Prev;
            } else {
              return null;
            }
          }
        };
        ClipperLib2.Clipper.prototype.GetMaximaPairEx = function(e) {
          var result = this.GetMaximaPair(e);
          if (result === null || result.OutIdx === ClipperLib2.ClipperBase.Skip || result.NextInAEL === result.PrevInAEL && !ClipperLib2.ClipperBase.IsHorizontal(result)) {
            return null;
          }
          return result;
        };
        ClipperLib2.Clipper.prototype.ProcessIntersections = function(topY) {
          if (this.m_ActiveEdges === null)
            return true;
          try {
            this.BuildIntersectList(topY);
            if (this.m_IntersectList.length === 0)
              return true;
            if (this.m_IntersectList.length === 1 || this.FixupIntersectionOrder())
              this.ProcessIntersectList();
            else
              return false;
          } catch ($$e2) {
            this.m_SortedEdges = null;
            this.m_IntersectList.length = 0;
            ClipperLib2.Error("ProcessIntersections error");
          }
          this.m_SortedEdges = null;
          return true;
        };
        ClipperLib2.Clipper.prototype.BuildIntersectList = function(topY) {
          if (this.m_ActiveEdges === null)
            return;
          var e = this.m_ActiveEdges;
          this.m_SortedEdges = e;
          while (e !== null) {
            e.PrevInSEL = e.PrevInAEL;
            e.NextInSEL = e.NextInAEL;
            e.Curr.X = ClipperLib2.Clipper.TopX(e, topY);
            e = e.NextInAEL;
          }
          var isModified = true;
          while (isModified && this.m_SortedEdges !== null) {
            isModified = false;
            e = this.m_SortedEdges;
            while (e.NextInSEL !== null) {
              var eNext = e.NextInSEL;
              var pt3 = new ClipperLib2.IntPoint0();
              if (e.Curr.X > eNext.Curr.X) {
                this.IntersectPoint(e, eNext, pt3);
                if (pt3.Y < topY) {
                  pt3 = new ClipperLib2.IntPoint2(ClipperLib2.Clipper.TopX(e, topY), topY);
                }
                var newNode = new ClipperLib2.IntersectNode();
                newNode.Edge1 = e;
                newNode.Edge2 = eNext;
                newNode.Pt.X = pt3.X;
                newNode.Pt.Y = pt3.Y;
                if (ClipperLib2.use_xyz) newNode.Pt.Z = pt3.Z;
                this.m_IntersectList.push(newNode);
                this.SwapPositionsInSEL(e, eNext);
                isModified = true;
              } else
                e = eNext;
            }
            if (e.PrevInSEL !== null)
              e.PrevInSEL.NextInSEL = null;
            else
              break;
          }
          this.m_SortedEdges = null;
        };
        ClipperLib2.Clipper.prototype.EdgesAdjacent = function(inode) {
          return inode.Edge1.NextInSEL === inode.Edge2 || inode.Edge1.PrevInSEL === inode.Edge2;
        };
        ClipperLib2.Clipper.IntersectNodeSort = function(node1, node2) {
          return node2.Pt.Y - node1.Pt.Y;
        };
        ClipperLib2.Clipper.prototype.FixupIntersectionOrder = function() {
          this.m_IntersectList.sort(this.m_IntersectNodeComparer);
          this.CopyAELToSEL();
          var cnt = this.m_IntersectList.length;
          for (var i = 0; i < cnt; i++) {
            if (!this.EdgesAdjacent(this.m_IntersectList[i])) {
              var j = i + 1;
              while (j < cnt && !this.EdgesAdjacent(this.m_IntersectList[j]))
                j++;
              if (j === cnt)
                return false;
              var tmp = this.m_IntersectList[i];
              this.m_IntersectList[i] = this.m_IntersectList[j];
              this.m_IntersectList[j] = tmp;
            }
            this.SwapPositionsInSEL(this.m_IntersectList[i].Edge1, this.m_IntersectList[i].Edge2);
          }
          return true;
        };
        ClipperLib2.Clipper.prototype.ProcessIntersectList = function() {
          for (var i = 0, ilen = this.m_IntersectList.length; i < ilen; i++) {
            var iNode = this.m_IntersectList[i];
            this.IntersectEdges(iNode.Edge1, iNode.Edge2, iNode.Pt);
            this.SwapPositionsInAEL(iNode.Edge1, iNode.Edge2);
          }
          this.m_IntersectList.length = 0;
        };
        var R1 = function(a) {
          return a < 0 ? Math.ceil(a - 0.5) : Math.round(a);
        };
        var R2 = function(a) {
          return a < 0 ? Math.ceil(a - 0.5) : Math.floor(a + 0.5);
        };
        var R3 = function(a) {
          return a < 0 ? -Math.round(Math.abs(a)) : Math.round(a);
        };
        var R4 = function(a) {
          if (a < 0) {
            a -= 0.5;
            return a < -2147483648 ? Math.ceil(a) : a | 0;
          } else {
            a += 0.5;
            return a > 2147483647 ? Math.floor(a) : a | 0;
          }
        };
        if (browser.msie) ClipperLib2.Clipper.Round = R1;
        else if (browser.chromium) ClipperLib2.Clipper.Round = R3;
        else if (browser.safari) ClipperLib2.Clipper.Round = R4;
        else ClipperLib2.Clipper.Round = R2;
        ClipperLib2.Clipper.TopX = function(edge, currentY) {
          if (currentY === edge.Top.Y)
            return edge.Top.X;
          return edge.Bot.X + ClipperLib2.Clipper.Round(edge.Dx * (currentY - edge.Bot.Y));
        };
        ClipperLib2.Clipper.prototype.IntersectPoint = function(edge1, edge2, ip) {
          ip.X = 0;
          ip.Y = 0;
          var b1, b2;
          if (edge1.Dx === edge2.Dx) {
            ip.Y = edge1.Curr.Y;
            ip.X = ClipperLib2.Clipper.TopX(edge1, ip.Y);
            return;
          }
          if (edge1.Delta.X === 0) {
            ip.X = edge1.Bot.X;
            if (ClipperLib2.ClipperBase.IsHorizontal(edge2)) {
              ip.Y = edge2.Bot.Y;
            } else {
              b2 = edge2.Bot.Y - edge2.Bot.X / edge2.Dx;
              ip.Y = ClipperLib2.Clipper.Round(ip.X / edge2.Dx + b2);
            }
          } else if (edge2.Delta.X === 0) {
            ip.X = edge2.Bot.X;
            if (ClipperLib2.ClipperBase.IsHorizontal(edge1)) {
              ip.Y = edge1.Bot.Y;
            } else {
              b1 = edge1.Bot.Y - edge1.Bot.X / edge1.Dx;
              ip.Y = ClipperLib2.Clipper.Round(ip.X / edge1.Dx + b1);
            }
          } else {
            b1 = edge1.Bot.X - edge1.Bot.Y * edge1.Dx;
            b2 = edge2.Bot.X - edge2.Bot.Y * edge2.Dx;
            var q = (b2 - b1) / (edge1.Dx - edge2.Dx);
            ip.Y = ClipperLib2.Clipper.Round(q);
            if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
              ip.X = ClipperLib2.Clipper.Round(edge1.Dx * q + b1);
            else
              ip.X = ClipperLib2.Clipper.Round(edge2.Dx * q + b2);
          }
          if (ip.Y < edge1.Top.Y || ip.Y < edge2.Top.Y) {
            if (edge1.Top.Y > edge2.Top.Y) {
              ip.Y = edge1.Top.Y;
              ip.X = ClipperLib2.Clipper.TopX(edge2, edge1.Top.Y);
              return ip.X < edge1.Top.X;
            } else
              ip.Y = edge2.Top.Y;
            if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
              ip.X = ClipperLib2.Clipper.TopX(edge1, ip.Y);
            else
              ip.X = ClipperLib2.Clipper.TopX(edge2, ip.Y);
          }
          if (ip.Y > edge1.Curr.Y) {
            ip.Y = edge1.Curr.Y;
            if (Math.abs(edge1.Dx) > Math.abs(edge2.Dx))
              ip.X = ClipperLib2.Clipper.TopX(edge2, ip.Y);
            else
              ip.X = ClipperLib2.Clipper.TopX(edge1, ip.Y);
          }
        };
        ClipperLib2.Clipper.prototype.ProcessEdgesAtTopOfScanbeam = function(topY) {
          var e = this.m_ActiveEdges;
          while (e !== null) {
            var IsMaximaEdge = this.IsMaxima(e, topY);
            if (IsMaximaEdge) {
              var eMaxPair = this.GetMaximaPairEx(e);
              IsMaximaEdge = eMaxPair === null || !ClipperLib2.ClipperBase.IsHorizontal(eMaxPair);
            }
            if (IsMaximaEdge) {
              if (this.StrictlySimple) {
                this.InsertMaxima(e.Top.X);
              }
              var ePrev = e.PrevInAEL;
              this.DoMaxima(e);
              if (ePrev === null)
                e = this.m_ActiveEdges;
              else
                e = ePrev.NextInAEL;
            } else {
              if (this.IsIntermediate(e, topY) && ClipperLib2.ClipperBase.IsHorizontal(e.NextInLML)) {
                e = this.UpdateEdgeIntoAEL(e);
                if (e.OutIdx >= 0)
                  this.AddOutPt(e, e.Bot);
                this.AddEdgeToSEL(e);
              } else {
                e.Curr.X = ClipperLib2.Clipper.TopX(e, topY);
                e.Curr.Y = topY;
              }
              if (ClipperLib2.use_xyz) {
                if (e.Top.Y === topY) e.Curr.Z = e.Top.Z;
                else if (e.Bot.Y === topY) e.Curr.Z = e.Bot.Z;
                else e.Curr.Z = 0;
              }
              if (this.StrictlySimple) {
                var ePrev = e.PrevInAEL;
                if (e.OutIdx >= 0 && e.WindDelta !== 0 && ePrev !== null && ePrev.OutIdx >= 0 && ePrev.Curr.X === e.Curr.X && ePrev.WindDelta !== 0) {
                  var ip = new ClipperLib2.IntPoint1(e.Curr);
                  if (ClipperLib2.use_xyz) {
                    this.SetZ(ip, ePrev, e);
                  }
                  var op = this.AddOutPt(ePrev, ip);
                  var op2 = this.AddOutPt(e, ip);
                  this.AddJoin(op, op2, ip);
                }
              }
              e = e.NextInAEL;
            }
          }
          this.ProcessHorizontals();
          this.m_Maxima = null;
          e = this.m_ActiveEdges;
          while (e !== null) {
            if (this.IsIntermediate(e, topY)) {
              var op = null;
              if (e.OutIdx >= 0)
                op = this.AddOutPt(e, e.Top);
              e = this.UpdateEdgeIntoAEL(e);
              var ePrev = e.PrevInAEL;
              var eNext = e.NextInAEL;
              if (ePrev !== null && ePrev.Curr.X === e.Bot.X && ePrev.Curr.Y === e.Bot.Y && op !== null && ePrev.OutIdx >= 0 && ePrev.Curr.Y === ePrev.Top.Y && ClipperLib2.ClipperBase.SlopesEqual5(e.Curr, e.Top, ePrev.Curr, ePrev.Top, this.m_UseFullRange) && e.WindDelta !== 0 && ePrev.WindDelta !== 0) {
                var op2 = this.AddOutPt(ePrev2, e.Bot);
                this.AddJoin(op, op2, e.Top);
              } else if (eNext !== null && eNext.Curr.X === e.Bot.X && eNext.Curr.Y === e.Bot.Y && op !== null && eNext.OutIdx >= 0 && eNext.Curr.Y === eNext.Top.Y && ClipperLib2.ClipperBase.SlopesEqual5(e.Curr, e.Top, eNext.Curr, eNext.Top, this.m_UseFullRange) && e.WindDelta !== 0 && eNext.WindDelta !== 0) {
                var op2 = this.AddOutPt(eNext, e.Bot);
                this.AddJoin(op, op2, e.Top);
              }
            }
            e = e.NextInAEL;
          }
        };
        ClipperLib2.Clipper.prototype.DoMaxima = function(e) {
          var eMaxPair = this.GetMaximaPairEx(e);
          if (eMaxPair === null) {
            if (e.OutIdx >= 0)
              this.AddOutPt(e, e.Top);
            this.DeleteFromAEL(e);
            return;
          }
          var eNext = e.NextInAEL;
          while (eNext !== null && eNext !== eMaxPair) {
            this.IntersectEdges(e, eNext, e.Top);
            this.SwapPositionsInAEL(e, eNext);
            eNext = e.NextInAEL;
          }
          if (e.OutIdx === -1 && eMaxPair.OutIdx === -1) {
            this.DeleteFromAEL(e);
            this.DeleteFromAEL(eMaxPair);
          } else if (e.OutIdx >= 0 && eMaxPair.OutIdx >= 0) {
            if (e.OutIdx >= 0) this.AddLocalMaxPoly(e, eMaxPair, e.Top);
            this.DeleteFromAEL(e);
            this.DeleteFromAEL(eMaxPair);
          } else if (ClipperLib2.use_lines && e.WindDelta === 0) {
            if (e.OutIdx >= 0) {
              this.AddOutPt(e, e.Top);
              e.OutIdx = ClipperLib2.ClipperBase.Unassigned;
            }
            this.DeleteFromAEL(e);
            if (eMaxPair.OutIdx >= 0) {
              this.AddOutPt(eMaxPair, e.Top);
              eMaxPair.OutIdx = ClipperLib2.ClipperBase.Unassigned;
            }
            this.DeleteFromAEL(eMaxPair);
          } else
            ClipperLib2.Error("DoMaxima error");
        };
        ClipperLib2.Clipper.ReversePaths = function(polys) {
          for (var i = 0, len = polys.length; i < len; i++)
            polys[i].reverse();
        };
        ClipperLib2.Clipper.Orientation = function(poly) {
          return ClipperLib2.Clipper.Area(poly) >= 0;
        };
        ClipperLib2.Clipper.prototype.PointCount = function(pts) {
          if (pts === null)
            return 0;
          var result = 0;
          var p = pts;
          do {
            result++;
            p = p.Next;
          } while (p !== pts);
          return result;
        };
        ClipperLib2.Clipper.prototype.BuildResult = function(polyg) {
          ClipperLib2.Clear(polyg);
          for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            var outRec = this.m_PolyOuts[i];
            if (outRec.Pts === null)
              continue;
            var p = outRec.Pts.Prev;
            var cnt = this.PointCount(p);
            if (cnt < 2)
              continue;
            var pg = new Array(cnt);
            for (var j = 0; j < cnt; j++) {
              pg[j] = p.Pt;
              p = p.Prev;
            }
            polyg.push(pg);
          }
        };
        ClipperLib2.Clipper.prototype.BuildResult2 = function(polytree) {
          polytree.Clear();
          for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            var outRec = this.m_PolyOuts[i];
            var cnt = this.PointCount(outRec.Pts);
            if (outRec.IsOpen && cnt < 2 || !outRec.IsOpen && cnt < 3)
              continue;
            this.FixHoleLinkage(outRec);
            var pn = new ClipperLib2.PolyNode();
            polytree.m_AllPolys.push(pn);
            outRec.PolyNode = pn;
            pn.m_polygon.length = cnt;
            var op = outRec.Pts.Prev;
            for (var j = 0; j < cnt; j++) {
              pn.m_polygon[j] = op.Pt;
              op = op.Prev;
            }
          }
          for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            var outRec = this.m_PolyOuts[i];
            if (outRec.PolyNode === null)
              continue;
            else if (outRec.IsOpen) {
              outRec.PolyNode.IsOpen = true;
              polytree.AddChild(outRec.PolyNode);
            } else if (outRec.FirstLeft !== null && outRec.FirstLeft.PolyNode !== null)
              outRec.FirstLeft.PolyNode.AddChild(outRec.PolyNode);
            else
              polytree.AddChild(outRec.PolyNode);
          }
        };
        ClipperLib2.Clipper.prototype.FixupOutPolyline = function(outRec) {
          var pp = outRec.Pts;
          var lastPP = pp.Prev;
          while (pp !== lastPP) {
            pp = pp.Next;
            if (ClipperLib2.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt)) {
              if (pp === lastPP) {
                lastPP = pp.Prev;
              }
              var tmpPP = pp.Prev;
              tmpPP.Next = pp.Next;
              pp.Next.Prev = tmpPP;
              pp = tmpPP;
            }
          }
          if (pp === pp.Prev) {
            outRec.Pts = null;
          }
        };
        ClipperLib2.Clipper.prototype.FixupOutPolygon = function(outRec) {
          var lastOK = null;
          outRec.BottomPt = null;
          var pp = outRec.Pts;
          var preserveCol = this.PreserveCollinear || this.StrictlySimple;
          for (; ; ) {
            if (pp.Prev === pp || pp.Prev === pp.Next) {
              outRec.Pts = null;
              return;
            }
            if (ClipperLib2.IntPoint.op_Equality(pp.Pt, pp.Next.Pt) || ClipperLib2.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt) || ClipperLib2.ClipperBase.SlopesEqual4(pp.Prev.Pt, pp.Pt, pp.Next.Pt, this.m_UseFullRange) && (!preserveCol || !this.Pt2IsBetweenPt1AndPt3(pp.Prev.Pt, pp.Pt, pp.Next.Pt))) {
              lastOK = null;
              pp.Prev.Next = pp.Next;
              pp.Next.Prev = pp.Prev;
              pp = pp.Prev;
            } else if (pp === lastOK)
              break;
            else {
              if (lastOK === null)
                lastOK = pp;
              pp = pp.Next;
            }
          }
          outRec.Pts = pp;
        };
        ClipperLib2.Clipper.prototype.DupOutPt = function(outPt, InsertAfter) {
          var result = new ClipperLib2.OutPt();
          result.Pt.X = outPt.Pt.X;
          result.Pt.Y = outPt.Pt.Y;
          if (ClipperLib2.use_xyz) result.Pt.Z = outPt.Pt.Z;
          result.Idx = outPt.Idx;
          if (InsertAfter) {
            result.Next = outPt.Next;
            result.Prev = outPt;
            outPt.Next.Prev = result;
            outPt.Next = result;
          } else {
            result.Prev = outPt.Prev;
            result.Next = outPt;
            outPt.Prev.Next = result;
            outPt.Prev = result;
          }
          return result;
        };
        ClipperLib2.Clipper.prototype.GetOverlap = function(a1, a2, b1, b2, $val) {
          if (a1 < a2) {
            if (b1 < b2) {
              $val.Left = Math.max(a1, b1);
              $val.Right = Math.min(a2, b2);
            } else {
              $val.Left = Math.max(a1, b2);
              $val.Right = Math.min(a2, b1);
            }
          } else {
            if (b1 < b2) {
              $val.Left = Math.max(a2, b1);
              $val.Right = Math.min(a1, b2);
            } else {
              $val.Left = Math.max(a2, b2);
              $val.Right = Math.min(a1, b1);
            }
          }
          return $val.Left < $val.Right;
        };
        ClipperLib2.Clipper.prototype.JoinHorz = function(op1, op1b, op2, op2b, Pt, DiscardLeft) {
          var Dir1 = op1.Pt.X > op1b.Pt.X ? ClipperLib2.Direction.dRightToLeft : ClipperLib2.Direction.dLeftToRight;
          var Dir2 = op2.Pt.X > op2b.Pt.X ? ClipperLib2.Direction.dRightToLeft : ClipperLib2.Direction.dLeftToRight;
          if (Dir1 === Dir2)
            return false;
          if (Dir1 === ClipperLib2.Direction.dLeftToRight) {
            while (op1.Next.Pt.X <= Pt.X && op1.Next.Pt.X >= op1.Pt.X && op1.Next.Pt.Y === Pt.Y)
              op1 = op1.Next;
            if (DiscardLeft && op1.Pt.X !== Pt.X)
              op1 = op1.Next;
            op1b = this.DupOutPt(op1, !DiscardLeft);
            if (ClipperLib2.IntPoint.op_Inequality(op1b.Pt, Pt)) {
              op1 = op1b;
              op1.Pt.X = Pt.X;
              op1.Pt.Y = Pt.Y;
              if (ClipperLib2.use_xyz) op1.Pt.Z = Pt.Z;
              op1b = this.DupOutPt(op1, !DiscardLeft);
            }
          } else {
            while (op1.Next.Pt.X >= Pt.X && op1.Next.Pt.X <= op1.Pt.X && op1.Next.Pt.Y === Pt.Y)
              op1 = op1.Next;
            if (!DiscardLeft && op1.Pt.X !== Pt.X)
              op1 = op1.Next;
            op1b = this.DupOutPt(op1, DiscardLeft);
            if (ClipperLib2.IntPoint.op_Inequality(op1b.Pt, Pt)) {
              op1 = op1b;
              op1.Pt.X = Pt.X;
              op1.Pt.Y = Pt.Y;
              if (ClipperLib2.use_xyz) op1.Pt.Z = Pt.Z;
              op1b = this.DupOutPt(op1, DiscardLeft);
            }
          }
          if (Dir2 === ClipperLib2.Direction.dLeftToRight) {
            while (op2.Next.Pt.X <= Pt.X && op2.Next.Pt.X >= op2.Pt.X && op2.Next.Pt.Y === Pt.Y)
              op2 = op2.Next;
            if (DiscardLeft && op2.Pt.X !== Pt.X)
              op2 = op2.Next;
            op2b = this.DupOutPt(op2, !DiscardLeft);
            if (ClipperLib2.IntPoint.op_Inequality(op2b.Pt, Pt)) {
              op2 = op2b;
              op2.Pt.X = Pt.X;
              op2.Pt.Y = Pt.Y;
              if (ClipperLib2.use_xyz) op2.Pt.Z = Pt.Z;
              op2b = this.DupOutPt(op2, !DiscardLeft);
            }
          } else {
            while (op2.Next.Pt.X >= Pt.X && op2.Next.Pt.X <= op2.Pt.X && op2.Next.Pt.Y === Pt.Y)
              op2 = op2.Next;
            if (!DiscardLeft && op2.Pt.X !== Pt.X)
              op2 = op2.Next;
            op2b = this.DupOutPt(op2, DiscardLeft);
            if (ClipperLib2.IntPoint.op_Inequality(op2b.Pt, Pt)) {
              op2 = op2b;
              op2.Pt.X = Pt.X;
              op2.Pt.Y = Pt.Y;
              if (ClipperLib2.use_xyz) op2.Pt.Z = Pt.Z;
              op2b = this.DupOutPt(op2, DiscardLeft);
            }
          }
          if (Dir1 === ClipperLib2.Direction.dLeftToRight === DiscardLeft) {
            op1.Prev = op2;
            op2.Next = op1;
            op1b.Next = op2b;
            op2b.Prev = op1b;
          } else {
            op1.Next = op2;
            op2.Prev = op1;
            op1b.Prev = op2b;
            op2b.Next = op1b;
          }
          return true;
        };
        ClipperLib2.Clipper.prototype.JoinPoints = function(j, outRec1, outRec2) {
          var op1 = j.OutPt1, op1b = new ClipperLib2.OutPt();
          var op2 = j.OutPt2, op2b = new ClipperLib2.OutPt();
          var isHorizontal = j.OutPt1.Pt.Y === j.OffPt.Y;
          if (isHorizontal && ClipperLib2.IntPoint.op_Equality(j.OffPt, j.OutPt1.Pt) && ClipperLib2.IntPoint.op_Equality(j.OffPt, j.OutPt2.Pt)) {
            if (outRec1 !== outRec2) return false;
            op1b = j.OutPt1.Next;
            while (op1b !== op1 && ClipperLib2.IntPoint.op_Equality(op1b.Pt, j.OffPt))
              op1b = op1b.Next;
            var reverse1 = op1b.Pt.Y > j.OffPt.Y;
            op2b = j.OutPt2.Next;
            while (op2b !== op2 && ClipperLib2.IntPoint.op_Equality(op2b.Pt, j.OffPt))
              op2b = op2b.Next;
            var reverse2 = op2b.Pt.Y > j.OffPt.Y;
            if (reverse1 === reverse2)
              return false;
            if (reverse1) {
              op1b = this.DupOutPt(op1, false);
              op2b = this.DupOutPt(op2, true);
              op1.Prev = op2;
              op2.Next = op1;
              op1b.Next = op2b;
              op2b.Prev = op1b;
              j.OutPt1 = op1;
              j.OutPt2 = op1b;
              return true;
            } else {
              op1b = this.DupOutPt(op1, true);
              op2b = this.DupOutPt(op2, false);
              op1.Next = op2;
              op2.Prev = op1;
              op1b.Prev = op2b;
              op2b.Next = op1b;
              j.OutPt1 = op1;
              j.OutPt2 = op1b;
              return true;
            }
          } else if (isHorizontal) {
            op1b = op1;
            while (op1.Prev.Pt.Y === op1.Pt.Y && op1.Prev !== op1b && op1.Prev !== op2)
              op1 = op1.Prev;
            while (op1b.Next.Pt.Y === op1b.Pt.Y && op1b.Next !== op1 && op1b.Next !== op2)
              op1b = op1b.Next;
            if (op1b.Next === op1 || op1b.Next === op2)
              return false;
            op2b = op2;
            while (op2.Prev.Pt.Y === op2.Pt.Y && op2.Prev !== op2b && op2.Prev !== op1b)
              op2 = op2.Prev;
            while (op2b.Next.Pt.Y === op2b.Pt.Y && op2b.Next !== op2 && op2b.Next !== op1)
              op2b = op2b.Next;
            if (op2b.Next === op2 || op2b.Next === op1)
              return false;
            var $val = {
              Left: null,
              Right: null
            };
            if (!this.GetOverlap(op1.Pt.X, op1b.Pt.X, op2.Pt.X, op2b.Pt.X, $val))
              return false;
            var Left = $val.Left;
            var Right = $val.Right;
            var Pt = new ClipperLib2.IntPoint0();
            var DiscardLeftSide;
            if (op1.Pt.X >= Left && op1.Pt.X <= Right) {
              Pt.X = op1.Pt.X;
              Pt.Y = op1.Pt.Y;
              if (ClipperLib2.use_xyz) Pt.Z = op1.Pt.Z;
              DiscardLeftSide = op1.Pt.X > op1b.Pt.X;
            } else if (op2.Pt.X >= Left && op2.Pt.X <= Right) {
              Pt.X = op2.Pt.X;
              Pt.Y = op2.Pt.Y;
              if (ClipperLib2.use_xyz) Pt.Z = op2.Pt.Z;
              DiscardLeftSide = op2.Pt.X > op2b.Pt.X;
            } else if (op1b.Pt.X >= Left && op1b.Pt.X <= Right) {
              Pt.X = op1b.Pt.X;
              Pt.Y = op1b.Pt.Y;
              if (ClipperLib2.use_xyz) Pt.Z = op1b.Pt.Z;
              DiscardLeftSide = op1b.Pt.X > op1.Pt.X;
            } else {
              Pt.X = op2b.Pt.X;
              Pt.Y = op2b.Pt.Y;
              if (ClipperLib2.use_xyz) Pt.Z = op2b.Pt.Z;
              DiscardLeftSide = op2b.Pt.X > op2.Pt.X;
            }
            j.OutPt1 = op1;
            j.OutPt2 = op2;
            return this.JoinHorz(op1, op1b, op2, op2b, Pt, DiscardLeftSide);
          } else {
            op1b = op1.Next;
            while (ClipperLib2.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1)
              op1b = op1b.Next;
            var Reverse1 = op1b.Pt.Y > op1.Pt.Y || !ClipperLib2.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange);
            if (Reverse1) {
              op1b = op1.Prev;
              while (ClipperLib2.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1)
                op1b = op1b.Prev;
              if (op1b.Pt.Y > op1.Pt.Y || !ClipperLib2.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange))
                return false;
            }
            op2b = op2.Next;
            while (ClipperLib2.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2)
              op2b = op2b.Next;
            var Reverse2 = op2b.Pt.Y > op2.Pt.Y || !ClipperLib2.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange);
            if (Reverse2) {
              op2b = op2.Prev;
              while (ClipperLib2.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2)
                op2b = op2b.Prev;
              if (op2b.Pt.Y > op2.Pt.Y || !ClipperLib2.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange))
                return false;
            }
            if (op1b === op1 || op2b === op2 || op1b === op2b || outRec1 === outRec2 && Reverse1 === Reverse2)
              return false;
            if (Reverse1) {
              op1b = this.DupOutPt(op1, false);
              op2b = this.DupOutPt(op2, true);
              op1.Prev = op2;
              op2.Next = op1;
              op1b.Next = op2b;
              op2b.Prev = op1b;
              j.OutPt1 = op1;
              j.OutPt2 = op1b;
              return true;
            } else {
              op1b = this.DupOutPt(op1, true);
              op2b = this.DupOutPt(op2, false);
              op1.Next = op2;
              op2.Prev = op1;
              op1b.Prev = op2b;
              op2b.Next = op1b;
              j.OutPt1 = op1;
              j.OutPt2 = op1b;
              return true;
            }
          }
        };
        ClipperLib2.Clipper.GetBounds = function(paths) {
          var i = 0, cnt = paths.length;
          while (i < cnt && paths[i].length === 0) i++;
          if (i === cnt) return new ClipperLib2.IntRect(0, 0, 0, 0);
          var result = new ClipperLib2.IntRect();
          result.left = paths[i][0].X;
          result.right = result.left;
          result.top = paths[i][0].Y;
          result.bottom = result.top;
          for (; i < cnt; i++)
            for (var j = 0, jlen = paths[i].length; j < jlen; j++) {
              if (paths[i][j].X < result.left) result.left = paths[i][j].X;
              else if (paths[i][j].X > result.right) result.right = paths[i][j].X;
              if (paths[i][j].Y < result.top) result.top = paths[i][j].Y;
              else if (paths[i][j].Y > result.bottom) result.bottom = paths[i][j].Y;
            }
          return result;
        };
        ClipperLib2.Clipper.prototype.GetBounds2 = function(ops) {
          var opStart = ops;
          var result = new ClipperLib2.IntRect();
          result.left = ops.Pt.X;
          result.right = ops.Pt.X;
          result.top = ops.Pt.Y;
          result.bottom = ops.Pt.Y;
          ops = ops.Next;
          while (ops !== opStart) {
            if (ops.Pt.X < result.left)
              result.left = ops.Pt.X;
            if (ops.Pt.X > result.right)
              result.right = ops.Pt.X;
            if (ops.Pt.Y < result.top)
              result.top = ops.Pt.Y;
            if (ops.Pt.Y > result.bottom)
              result.bottom = ops.Pt.Y;
            ops = ops.Next;
          }
          return result;
        };
        ClipperLib2.Clipper.PointInPolygon = function(pt3, path) {
          var result = 0, cnt = path.length;
          if (cnt < 3)
            return 0;
          var ip = path[0];
          for (var i = 1; i <= cnt; ++i) {
            var ipNext = i === cnt ? path[0] : path[i];
            if (ipNext.Y === pt3.Y) {
              if (ipNext.X === pt3.X || ip.Y === pt3.Y && ipNext.X > pt3.X === ip.X < pt3.X)
                return -1;
            }
            if (ip.Y < pt3.Y !== ipNext.Y < pt3.Y) {
              if (ip.X >= pt3.X) {
                if (ipNext.X > pt3.X)
                  result = 1 - result;
                else {
                  var d = (ip.X - pt3.X) * (ipNext.Y - pt3.Y) - (ipNext.X - pt3.X) * (ip.Y - pt3.Y);
                  if (d === 0)
                    return -1;
                  else if (d > 0 === ipNext.Y > ip.Y)
                    result = 1 - result;
                }
              } else {
                if (ipNext.X > pt3.X) {
                  var d = (ip.X - pt3.X) * (ipNext.Y - pt3.Y) - (ipNext.X - pt3.X) * (ip.Y - pt3.Y);
                  if (d === 0)
                    return -1;
                  else if (d > 0 === ipNext.Y > ip.Y)
                    result = 1 - result;
                }
              }
            }
            ip = ipNext;
          }
          return result;
        };
        ClipperLib2.Clipper.prototype.PointInPolygon = function(pt3, op) {
          var result = 0;
          var startOp = op;
          var ptx = pt3.X, pty = pt3.Y;
          var poly0x = op.Pt.X, poly0y = op.Pt.Y;
          do {
            op = op.Next;
            var poly1x = op.Pt.X, poly1y = op.Pt.Y;
            if (poly1y === pty) {
              if (poly1x === ptx || poly0y === pty && poly1x > ptx === poly0x < ptx)
                return -1;
            }
            if (poly0y < pty !== poly1y < pty) {
              if (poly0x >= ptx) {
                if (poly1x > ptx)
                  result = 1 - result;
                else {
                  var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
                  if (d === 0)
                    return -1;
                  if (d > 0 === poly1y > poly0y)
                    result = 1 - result;
                }
              } else {
                if (poly1x > ptx) {
                  var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
                  if (d === 0)
                    return -1;
                  if (d > 0 === poly1y > poly0y)
                    result = 1 - result;
                }
              }
            }
            poly0x = poly1x;
            poly0y = poly1y;
          } while (startOp !== op);
          return result;
        };
        ClipperLib2.Clipper.prototype.Poly2ContainsPoly1 = function(outPt1, outPt2) {
          var op = outPt1;
          do {
            var res = this.PointInPolygon(op.Pt, outPt2);
            if (res >= 0)
              return res > 0;
            op = op.Next;
          } while (op !== outPt1);
          return true;
        };
        ClipperLib2.Clipper.prototype.FixupFirstLefts1 = function(OldOutRec, NewOutRec) {
          var outRec, firstLeft;
          for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            outRec = this.m_PolyOuts[i];
            firstLeft = ClipperLib2.Clipper.ParseFirstLeft(outRec.FirstLeft);
            if (outRec.Pts !== null && firstLeft === OldOutRec) {
              if (this.Poly2ContainsPoly1(outRec.Pts, NewOutRec.Pts))
                outRec.FirstLeft = NewOutRec;
            }
          }
        };
        ClipperLib2.Clipper.prototype.FixupFirstLefts2 = function(innerOutRec, outerOutRec) {
          var orfl = outerOutRec.FirstLeft;
          var outRec, firstLeft;
          for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            outRec = this.m_PolyOuts[i];
            if (outRec.Pts === null || outRec === outerOutRec || outRec === innerOutRec)
              continue;
            firstLeft = ClipperLib2.Clipper.ParseFirstLeft(outRec.FirstLeft);
            if (firstLeft !== orfl && firstLeft !== innerOutRec && firstLeft !== outerOutRec)
              continue;
            if (this.Poly2ContainsPoly1(outRec.Pts, innerOutRec.Pts))
              outRec.FirstLeft = innerOutRec;
            else if (this.Poly2ContainsPoly1(outRec.Pts, outerOutRec.Pts))
              outRec.FirstLeft = outerOutRec;
            else if (outRec.FirstLeft === innerOutRec || outRec.FirstLeft === outerOutRec)
              outRec.FirstLeft = orfl;
          }
        };
        ClipperLib2.Clipper.prototype.FixupFirstLefts3 = function(OldOutRec, NewOutRec) {
          var outRec;
          var firstLeft;
          for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            outRec = this.m_PolyOuts[i];
            firstLeft = ClipperLib2.Clipper.ParseFirstLeft(outRec.FirstLeft);
            if (outRec.Pts !== null && firstLeft === OldOutRec)
              outRec.FirstLeft = NewOutRec;
          }
        };
        ClipperLib2.Clipper.ParseFirstLeft = function(FirstLeft) {
          while (FirstLeft !== null && FirstLeft.Pts === null)
            FirstLeft = FirstLeft.FirstLeft;
          return FirstLeft;
        };
        ClipperLib2.Clipper.prototype.JoinCommonEdges = function() {
          for (var i = 0, ilen = this.m_Joins.length; i < ilen; i++) {
            var join = this.m_Joins[i];
            var outRec1 = this.GetOutRec(join.OutPt1.Idx);
            var outRec2 = this.GetOutRec(join.OutPt2.Idx);
            if (outRec1.Pts === null || outRec2.Pts === null)
              continue;
            if (outRec1.IsOpen || outRec2.IsOpen) {
              continue;
            }
            var holeStateRec;
            if (outRec1 === outRec2)
              holeStateRec = outRec1;
            else if (this.OutRec1RightOfOutRec2(outRec1, outRec2))
              holeStateRec = outRec2;
            else if (this.OutRec1RightOfOutRec2(outRec2, outRec1))
              holeStateRec = outRec1;
            else
              holeStateRec = this.GetLowermostRec(outRec1, outRec2);
            if (!this.JoinPoints(join, outRec1, outRec2)) continue;
            if (outRec1 === outRec2) {
              outRec1.Pts = join.OutPt1;
              outRec1.BottomPt = null;
              outRec2 = this.CreateOutRec();
              outRec2.Pts = join.OutPt2;
              this.UpdateOutPtIdxs(outRec2);
              if (this.Poly2ContainsPoly1(outRec2.Pts, outRec1.Pts)) {
                outRec2.IsHole = !outRec1.IsHole;
                outRec2.FirstLeft = outRec1;
                if (this.m_UsingPolyTree)
                  this.FixupFirstLefts2(outRec2, outRec1);
                if ((outRec2.IsHole ^ this.ReverseSolution) == this.Area$1(outRec2) > 0)
                  this.ReversePolyPtLinks(outRec2.Pts);
              } else if (this.Poly2ContainsPoly1(outRec1.Pts, outRec2.Pts)) {
                outRec2.IsHole = outRec1.IsHole;
                outRec1.IsHole = !outRec2.IsHole;
                outRec2.FirstLeft = outRec1.FirstLeft;
                outRec1.FirstLeft = outRec2;
                if (this.m_UsingPolyTree)
                  this.FixupFirstLefts2(outRec1, outRec2);
                if ((outRec1.IsHole ^ this.ReverseSolution) == this.Area$1(outRec1) > 0)
                  this.ReversePolyPtLinks(outRec1.Pts);
              } else {
                outRec2.IsHole = outRec1.IsHole;
                outRec2.FirstLeft = outRec1.FirstLeft;
                if (this.m_UsingPolyTree)
                  this.FixupFirstLefts1(outRec1, outRec2);
              }
            } else {
              outRec2.Pts = null;
              outRec2.BottomPt = null;
              outRec2.Idx = outRec1.Idx;
              outRec1.IsHole = holeStateRec.IsHole;
              if (holeStateRec === outRec2)
                outRec1.FirstLeft = outRec2.FirstLeft;
              outRec2.FirstLeft = outRec1;
              if (this.m_UsingPolyTree)
                this.FixupFirstLefts3(outRec2, outRec1);
            }
          }
        };
        ClipperLib2.Clipper.prototype.UpdateOutPtIdxs = function(outrec) {
          var op = outrec.Pts;
          do {
            op.Idx = outrec.Idx;
            op = op.Prev;
          } while (op !== outrec.Pts);
        };
        ClipperLib2.Clipper.prototype.DoSimplePolygons = function() {
          var i = 0;
          while (i < this.m_PolyOuts.length) {
            var outrec = this.m_PolyOuts[i++];
            var op = outrec.Pts;
            if (op === null || outrec.IsOpen)
              continue;
            do {
              var op2 = op.Next;
              while (op2 !== outrec.Pts) {
                if (ClipperLib2.IntPoint.op_Equality(op.Pt, op2.Pt) && op2.Next !== op && op2.Prev !== op) {
                  var op3 = op.Prev;
                  var op4 = op2.Prev;
                  op.Prev = op4;
                  op4.Next = op;
                  op2.Prev = op3;
                  op3.Next = op2;
                  outrec.Pts = op;
                  var outrec2 = this.CreateOutRec();
                  outrec2.Pts = op2;
                  this.UpdateOutPtIdxs(outrec2);
                  if (this.Poly2ContainsPoly1(outrec2.Pts, outrec.Pts)) {
                    outrec2.IsHole = !outrec.IsHole;
                    outrec2.FirstLeft = outrec;
                    if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec2, outrec);
                  } else if (this.Poly2ContainsPoly1(outrec.Pts, outrec2.Pts)) {
                    outrec2.IsHole = outrec.IsHole;
                    outrec.IsHole = !outrec2.IsHole;
                    outrec2.FirstLeft = outrec.FirstLeft;
                    outrec.FirstLeft = outrec2;
                    if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec, outrec2);
                  } else {
                    outrec2.IsHole = outrec.IsHole;
                    outrec2.FirstLeft = outrec.FirstLeft;
                    if (this.m_UsingPolyTree) this.FixupFirstLefts1(outrec, outrec2);
                  }
                  op2 = op;
                }
                op2 = op2.Next;
              }
              op = op.Next;
            } while (op !== outrec.Pts);
          }
        };
        ClipperLib2.Clipper.Area = function(poly) {
          if (!Array.isArray(poly))
            return 0;
          var cnt = poly.length;
          if (cnt < 3)
            return 0;
          var a = 0;
          for (var i = 0, j = cnt - 1; i < cnt; ++i) {
            a += (poly[j].X + poly[i].X) * (poly[j].Y - poly[i].Y);
            j = i;
          }
          return -a * 0.5;
        };
        ClipperLib2.Clipper.prototype.Area = function(op) {
          var opFirst = op;
          if (op === null) return 0;
          var a = 0;
          do {
            a = a + (op.Prev.Pt.X + op.Pt.X) * (op.Prev.Pt.Y - op.Pt.Y);
            op = op.Next;
          } while (op !== opFirst);
          return a * 0.5;
        };
        ClipperLib2.Clipper.prototype.Area$1 = function(outRec) {
          return this.Area(outRec.Pts);
        };
        ClipperLib2.Clipper.SimplifyPolygon = function(poly, fillType) {
          var result = new Array();
          var c = new ClipperLib2.Clipper(0);
          c.StrictlySimple = true;
          c.AddPath(poly, ClipperLib2.PolyType.ptSubject, true);
          c.Execute(ClipperLib2.ClipType.ctUnion, result, fillType, fillType);
          return result;
        };
        ClipperLib2.Clipper.SimplifyPolygons = function(polys, fillType) {
          if (typeof fillType === "undefined") fillType = ClipperLib2.PolyFillType.pftEvenOdd;
          var result = new Array();
          var c = new ClipperLib2.Clipper(0);
          c.StrictlySimple = true;
          c.AddPaths(polys, ClipperLib2.PolyType.ptSubject, true);
          c.Execute(ClipperLib2.ClipType.ctUnion, result, fillType, fillType);
          return result;
        };
        ClipperLib2.Clipper.DistanceSqrd = function(pt1, pt22) {
          var dx = pt1.X - pt22.X;
          var dy = pt1.Y - pt22.Y;
          return dx * dx + dy * dy;
        };
        ClipperLib2.Clipper.DistanceFromLineSqrd = function(pt3, ln1, ln2) {
          var A = ln1.Y - ln2.Y;
          var B = ln2.X - ln1.X;
          var C = A * ln1.X + B * ln1.Y;
          C = A * pt3.X + B * pt3.Y - C;
          return C * C / (A * A + B * B);
        };
        ClipperLib2.Clipper.SlopesNearCollinear = function(pt1, pt22, pt3, distSqrd) {
          if (Math.abs(pt1.X - pt22.X) > Math.abs(pt1.Y - pt22.Y)) {
            if (pt1.X > pt22.X === pt1.X < pt3.X)
              return ClipperLib2.Clipper.DistanceFromLineSqrd(pt1, pt22, pt3) < distSqrd;
            else if (pt22.X > pt1.X === pt22.X < pt3.X)
              return ClipperLib2.Clipper.DistanceFromLineSqrd(pt22, pt1, pt3) < distSqrd;
            else
              return ClipperLib2.Clipper.DistanceFromLineSqrd(pt3, pt1, pt22) < distSqrd;
          } else {
            if (pt1.Y > pt22.Y === pt1.Y < pt3.Y)
              return ClipperLib2.Clipper.DistanceFromLineSqrd(pt1, pt22, pt3) < distSqrd;
            else if (pt22.Y > pt1.Y === pt22.Y < pt3.Y)
              return ClipperLib2.Clipper.DistanceFromLineSqrd(pt22, pt1, pt3) < distSqrd;
            else
              return ClipperLib2.Clipper.DistanceFromLineSqrd(pt3, pt1, pt22) < distSqrd;
          }
        };
        ClipperLib2.Clipper.PointsAreClose = function(pt1, pt22, distSqrd) {
          var dx = pt1.X - pt22.X;
          var dy = pt1.Y - pt22.Y;
          return dx * dx + dy * dy <= distSqrd;
        };
        ClipperLib2.Clipper.ExcludeOp = function(op) {
          var result = op.Prev;
          result.Next = op.Next;
          op.Next.Prev = result;
          result.Idx = 0;
          return result;
        };
        ClipperLib2.Clipper.CleanPolygon = function(path, distance) {
          if (typeof distance === "undefined") distance = 1.415;
          var cnt = path.length;
          if (cnt === 0)
            return new Array();
          var outPts = new Array(cnt);
          for (var i = 0; i < cnt; ++i)
            outPts[i] = new ClipperLib2.OutPt();
          for (var i = 0; i < cnt; ++i) {
            outPts[i].Pt = path[i];
            outPts[i].Next = outPts[(i + 1) % cnt];
            outPts[i].Next.Prev = outPts[i];
            outPts[i].Idx = 0;
          }
          var distSqrd = distance * distance;
          var op = outPts[0];
          while (op.Idx === 0 && op.Next !== op.Prev) {
            if (ClipperLib2.Clipper.PointsAreClose(op.Pt, op.Prev.Pt, distSqrd)) {
              op = ClipperLib2.Clipper.ExcludeOp(op);
              cnt--;
            } else if (ClipperLib2.Clipper.PointsAreClose(op.Prev.Pt, op.Next.Pt, distSqrd)) {
              ClipperLib2.Clipper.ExcludeOp(op.Next);
              op = ClipperLib2.Clipper.ExcludeOp(op);
              cnt -= 2;
            } else if (ClipperLib2.Clipper.SlopesNearCollinear(op.Prev.Pt, op.Pt, op.Next.Pt, distSqrd)) {
              op = ClipperLib2.Clipper.ExcludeOp(op);
              cnt--;
            } else {
              op.Idx = 1;
              op = op.Next;
            }
          }
          if (cnt < 3)
            cnt = 0;
          var result = new Array(cnt);
          for (var i = 0; i < cnt; ++i) {
            result[i] = new ClipperLib2.IntPoint1(op.Pt);
            op = op.Next;
          }
          outPts = null;
          return result;
        };
        ClipperLib2.Clipper.CleanPolygons = function(polys, distance) {
          var result = new Array(polys.length);
          for (var i = 0, ilen = polys.length; i < ilen; i++)
            result[i] = ClipperLib2.Clipper.CleanPolygon(polys[i], distance);
          return result;
        };
        ClipperLib2.Clipper.Minkowski = function(pattern, path, IsSum, IsClosed) {
          var delta = IsClosed ? 1 : 0;
          var polyCnt = pattern.length;
          var pathCnt = path.length;
          var result = new Array();
          if (IsSum)
            for (var i = 0; i < pathCnt; i++) {
              var p = new Array(polyCnt);
              for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
                p[j] = new ClipperLib2.IntPoint2(path[i].X + ip.X, path[i].Y + ip.Y);
              result.push(p);
            }
          else
            for (var i = 0; i < pathCnt; i++) {
              var p = new Array(polyCnt);
              for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
                p[j] = new ClipperLib2.IntPoint2(path[i].X - ip.X, path[i].Y - ip.Y);
              result.push(p);
            }
          var quads = new Array();
          for (var i = 0; i < pathCnt - 1 + delta; i++)
            for (var j = 0; j < polyCnt; j++) {
              var quad = new Array();
              quad.push(result[i % pathCnt][j % polyCnt]);
              quad.push(result[(i + 1) % pathCnt][j % polyCnt]);
              quad.push(result[(i + 1) % pathCnt][(j + 1) % polyCnt]);
              quad.push(result[i % pathCnt][(j + 1) % polyCnt]);
              if (!ClipperLib2.Clipper.Orientation(quad))
                quad.reverse();
              quads.push(quad);
            }
          return quads;
        };
        ClipperLib2.Clipper.MinkowskiSum = function(pattern, path_or_paths, pathIsClosed) {
          if (!(path_or_paths[0] instanceof Array)) {
            var path = path_or_paths;
            var paths = ClipperLib2.Clipper.Minkowski(pattern, path, true, pathIsClosed);
            var c = new ClipperLib2.Clipper();
            c.AddPaths(paths, ClipperLib2.PolyType.ptSubject, true);
            c.Execute(ClipperLib2.ClipType.ctUnion, paths, ClipperLib2.PolyFillType.pftNonZero, ClipperLib2.PolyFillType.pftNonZero);
            return paths;
          } else {
            var paths = path_or_paths;
            var solution = new ClipperLib2.Paths();
            var c = new ClipperLib2.Clipper();
            for (var i = 0; i < paths.length; ++i) {
              var tmp = ClipperLib2.Clipper.Minkowski(pattern, paths[i], true, pathIsClosed);
              c.AddPaths(tmp, ClipperLib2.PolyType.ptSubject, true);
              if (pathIsClosed) {
                var path = ClipperLib2.Clipper.TranslatePath(paths[i], pattern[0]);
                c.AddPath(path, ClipperLib2.PolyType.ptClip, true);
              }
            }
            c.Execute(
              ClipperLib2.ClipType.ctUnion,
              solution,
              ClipperLib2.PolyFillType.pftNonZero,
              ClipperLib2.PolyFillType.pftNonZero
            );
            return solution;
          }
        };
        ClipperLib2.Clipper.TranslatePath = function(path, delta) {
          var outPath = new ClipperLib2.Path();
          for (var i = 0; i < path.length; i++)
            outPath.push(new ClipperLib2.IntPoint2(path[i].X + delta.X, path[i].Y + delta.Y));
          return outPath;
        };
        ClipperLib2.Clipper.MinkowskiDiff = function(poly1, poly2) {
          var paths = ClipperLib2.Clipper.Minkowski(poly1, poly2, false, true);
          var c = new ClipperLib2.Clipper();
          c.AddPaths(paths, ClipperLib2.PolyType.ptSubject, true);
          c.Execute(ClipperLib2.ClipType.ctUnion, paths, ClipperLib2.PolyFillType.pftNonZero, ClipperLib2.PolyFillType.pftNonZero);
          return paths;
        };
        ClipperLib2.Clipper.PolyTreeToPaths = function(polytree) {
          var result = new Array();
          ClipperLib2.Clipper.AddPolyNodeToPaths(polytree, ClipperLib2.Clipper.NodeType.ntAny, result);
          return result;
        };
        ClipperLib2.Clipper.AddPolyNodeToPaths = function(polynode, nt, paths) {
          var match = true;
          switch (nt) {
            case ClipperLib2.Clipper.NodeType.ntOpen:
              return;
            case ClipperLib2.Clipper.NodeType.ntClosed:
              match = !polynode.IsOpen;
              break;
            default:
              break;
          }
          if (polynode.m_polygon.length > 0 && match)
            paths.push(polynode.m_polygon);
          for (var $i3 = 0, $t3 = polynode.Childs(), $l3 = $t3.length, pn = $t3[$i3]; $i3 < $l3; $i3++, pn = $t3[$i3])
            ClipperLib2.Clipper.AddPolyNodeToPaths(pn, nt, paths);
        };
        ClipperLib2.Clipper.OpenPathsFromPolyTree = function(polytree) {
          var result = new ClipperLib2.Paths();
          for (var i = 0, ilen = polytree.ChildCount(); i < ilen; i++)
            if (polytree.Childs()[i].IsOpen)
              result.push(polytree.Childs()[i].m_polygon);
          return result;
        };
        ClipperLib2.Clipper.ClosedPathsFromPolyTree = function(polytree) {
          var result = new ClipperLib2.Paths();
          ClipperLib2.Clipper.AddPolyNodeToPaths(polytree, ClipperLib2.Clipper.NodeType.ntClosed, result);
          return result;
        };
        Inherit(ClipperLib2.Clipper, ClipperLib2.ClipperBase);
        ClipperLib2.Clipper.NodeType = {
          ntAny: 0,
          ntOpen: 1,
          ntClosed: 2
        };
        ClipperLib2.ClipperOffset = function(miterLimit, arcTolerance) {
          if (typeof miterLimit === "undefined") miterLimit = 2;
          if (typeof arcTolerance === "undefined") arcTolerance = ClipperLib2.ClipperOffset.def_arc_tolerance;
          this.m_destPolys = new ClipperLib2.Paths();
          this.m_srcPoly = new ClipperLib2.Path();
          this.m_destPoly = new ClipperLib2.Path();
          this.m_normals = new Array();
          this.m_delta = 0;
          this.m_sinA = 0;
          this.m_sin = 0;
          this.m_cos = 0;
          this.m_miterLim = 0;
          this.m_StepsPerRad = 0;
          this.m_lowest = new ClipperLib2.IntPoint0();
          this.m_polyNodes = new ClipperLib2.PolyNode();
          this.MiterLimit = miterLimit;
          this.ArcTolerance = arcTolerance;
          this.m_lowest.X = -1;
        };
        ClipperLib2.ClipperOffset.two_pi = 6.28318530717959;
        ClipperLib2.ClipperOffset.def_arc_tolerance = 0.25;
        ClipperLib2.ClipperOffset.prototype.Clear = function() {
          ClipperLib2.Clear(this.m_polyNodes.Childs());
          this.m_lowest.X = -1;
        };
        ClipperLib2.ClipperOffset.Round = ClipperLib2.Clipper.Round;
        ClipperLib2.ClipperOffset.prototype.AddPath = function(path, joinType, endType) {
          var highI = path.length - 1;
          if (highI < 0)
            return;
          var newNode = new ClipperLib2.PolyNode();
          newNode.m_jointype = joinType;
          newNode.m_endtype = endType;
          if (endType === ClipperLib2.EndType.etClosedLine || endType === ClipperLib2.EndType.etClosedPolygon)
            while (highI > 0 && ClipperLib2.IntPoint.op_Equality(path[0], path[highI]))
              highI--;
          newNode.m_polygon.push(path[0]);
          var j = 0, k = 0;
          for (var i = 1; i <= highI; i++)
            if (ClipperLib2.IntPoint.op_Inequality(newNode.m_polygon[j], path[i])) {
              j++;
              newNode.m_polygon.push(path[i]);
              if (path[i].Y > newNode.m_polygon[k].Y || path[i].Y === newNode.m_polygon[k].Y && path[i].X < newNode.m_polygon[k].X)
                k = j;
            }
          if (endType === ClipperLib2.EndType.etClosedPolygon && j < 2) return;
          this.m_polyNodes.AddChild(newNode);
          if (endType !== ClipperLib2.EndType.etClosedPolygon)
            return;
          if (this.m_lowest.X < 0)
            this.m_lowest = new ClipperLib2.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
          else {
            var ip = this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y];
            if (newNode.m_polygon[k].Y > ip.Y || newNode.m_polygon[k].Y === ip.Y && newNode.m_polygon[k].X < ip.X)
              this.m_lowest = new ClipperLib2.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
          }
        };
        ClipperLib2.ClipperOffset.prototype.AddPaths = function(paths, joinType, endType) {
          for (var i = 0, ilen = paths.length; i < ilen; i++)
            this.AddPath(paths[i], joinType, endType);
        };
        ClipperLib2.ClipperOffset.prototype.FixOrientations = function() {
          if (this.m_lowest.X >= 0 && !ClipperLib2.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon)) {
            for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
              var node = this.m_polyNodes.Childs()[i];
              if (node.m_endtype === ClipperLib2.EndType.etClosedPolygon || node.m_endtype === ClipperLib2.EndType.etClosedLine && ClipperLib2.Clipper.Orientation(node.m_polygon))
                node.m_polygon.reverse();
            }
          } else {
            for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
              var node = this.m_polyNodes.Childs()[i];
              if (node.m_endtype === ClipperLib2.EndType.etClosedLine && !ClipperLib2.Clipper.Orientation(node.m_polygon))
                node.m_polygon.reverse();
            }
          }
        };
        ClipperLib2.ClipperOffset.GetUnitNormal = function(pt1, pt22) {
          var dx = pt22.X - pt1.X;
          var dy = pt22.Y - pt1.Y;
          if (dx === 0 && dy === 0)
            return new ClipperLib2.DoublePoint2(0, 0);
          var f = 1 / Math.sqrt(dx * dx + dy * dy);
          dx *= f;
          dy *= f;
          return new ClipperLib2.DoublePoint2(dy, -dx);
        };
        ClipperLib2.ClipperOffset.prototype.DoOffset = function(delta) {
          this.m_destPolys = new Array();
          this.m_delta = delta;
          if (ClipperLib2.ClipperBase.near_zero(delta)) {
            for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
              var node = this.m_polyNodes.Childs()[i];
              if (node.m_endtype === ClipperLib2.EndType.etClosedPolygon)
                this.m_destPolys.push(node.m_polygon);
            }
            return;
          }
          if (this.MiterLimit > 2)
            this.m_miterLim = 2 / (this.MiterLimit * this.MiterLimit);
          else
            this.m_miterLim = 0.5;
          var y;
          if (this.ArcTolerance <= 0)
            y = ClipperLib2.ClipperOffset.def_arc_tolerance;
          else if (this.ArcTolerance > Math.abs(delta) * ClipperLib2.ClipperOffset.def_arc_tolerance)
            y = Math.abs(delta) * ClipperLib2.ClipperOffset.def_arc_tolerance;
          else
            y = this.ArcTolerance;
          var steps = 3.14159265358979 / Math.acos(1 - y / Math.abs(delta));
          this.m_sin = Math.sin(ClipperLib2.ClipperOffset.two_pi / steps);
          this.m_cos = Math.cos(ClipperLib2.ClipperOffset.two_pi / steps);
          this.m_StepsPerRad = steps / ClipperLib2.ClipperOffset.two_pi;
          if (delta < 0)
            this.m_sin = -this.m_sin;
          for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
            var node = this.m_polyNodes.Childs()[i];
            this.m_srcPoly = node.m_polygon;
            var len = this.m_srcPoly.length;
            if (len === 0 || delta <= 0 && (len < 3 || node.m_endtype !== ClipperLib2.EndType.etClosedPolygon))
              continue;
            this.m_destPoly = new Array();
            if (len === 1) {
              if (node.m_jointype === ClipperLib2.JoinType.jtRound) {
                var X = 1, Y = 0;
                for (var j = 1; j <= steps; j++) {
                  this.m_destPoly.push(new ClipperLib2.IntPoint2(ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
                  var X2 = X;
                  X = X * this.m_cos - this.m_sin * Y;
                  Y = X2 * this.m_sin + Y * this.m_cos;
                }
              } else {
                var X = -1, Y = -1;
                for (var j = 0; j < 4; ++j) {
                  this.m_destPoly.push(new ClipperLib2.IntPoint2(ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
                  if (X < 0)
                    X = 1;
                  else if (Y < 0)
                    Y = 1;
                  else
                    X = -1;
                }
              }
              this.m_destPolys.push(this.m_destPoly);
              continue;
            }
            this.m_normals.length = 0;
            for (var j = 0; j < len - 1; j++)
              this.m_normals.push(ClipperLib2.ClipperOffset.GetUnitNormal(this.m_srcPoly[j], this.m_srcPoly[j + 1]));
            if (node.m_endtype === ClipperLib2.EndType.etClosedLine || node.m_endtype === ClipperLib2.EndType.etClosedPolygon)
              this.m_normals.push(ClipperLib2.ClipperOffset.GetUnitNormal(this.m_srcPoly[len - 1], this.m_srcPoly[0]));
            else
              this.m_normals.push(new ClipperLib2.DoublePoint1(this.m_normals[len - 2]));
            if (node.m_endtype === ClipperLib2.EndType.etClosedPolygon) {
              var k = len - 1;
              for (var j = 0; j < len; j++)
                k = this.OffsetPoint(j, k, node.m_jointype);
              this.m_destPolys.push(this.m_destPoly);
            } else if (node.m_endtype === ClipperLib2.EndType.etClosedLine) {
              var k = len - 1;
              for (var j = 0; j < len; j++)
                k = this.OffsetPoint(j, k, node.m_jointype);
              this.m_destPolys.push(this.m_destPoly);
              this.m_destPoly = new Array();
              var n = this.m_normals[len - 1];
              for (var j = len - 1; j > 0; j--)
                this.m_normals[j] = new ClipperLib2.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
              this.m_normals[0] = new ClipperLib2.DoublePoint2(-n.X, -n.Y);
              k = 0;
              for (var j = len - 1; j >= 0; j--)
                k = this.OffsetPoint(j, k, node.m_jointype);
              this.m_destPolys.push(this.m_destPoly);
            } else {
              var k = 0;
              for (var j = 1; j < len - 1; ++j)
                k = this.OffsetPoint(j, k, node.m_jointype);
              var pt1;
              if (node.m_endtype === ClipperLib2.EndType.etOpenButt) {
                var j = len - 1;
                pt1 = new ClipperLib2.IntPoint2(ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * delta), ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * delta));
                this.m_destPoly.push(pt1);
                pt1 = new ClipperLib2.IntPoint2(ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X - this.m_normals[j].X * delta), ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y - this.m_normals[j].Y * delta));
                this.m_destPoly.push(pt1);
              } else {
                var j = len - 1;
                k = len - 2;
                this.m_sinA = 0;
                this.m_normals[j] = new ClipperLib2.DoublePoint2(-this.m_normals[j].X, -this.m_normals[j].Y);
                if (node.m_endtype === ClipperLib2.EndType.etOpenSquare)
                  this.DoSquare(j, k);
                else
                  this.DoRound(j, k);
              }
              for (var j = len - 1; j > 0; j--)
                this.m_normals[j] = new ClipperLib2.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
              this.m_normals[0] = new ClipperLib2.DoublePoint2(-this.m_normals[1].X, -this.m_normals[1].Y);
              k = len - 1;
              for (var j = k - 1; j > 0; --j)
                k = this.OffsetPoint(j, k, node.m_jointype);
              if (node.m_endtype === ClipperLib2.EndType.etOpenButt) {
                pt1 = new ClipperLib2.IntPoint2(ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].X - this.m_normals[0].X * delta), ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].Y - this.m_normals[0].Y * delta));
                this.m_destPoly.push(pt1);
                pt1 = new ClipperLib2.IntPoint2(ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].X + this.m_normals[0].X * delta), ClipperLib2.ClipperOffset.Round(this.m_srcPoly[0].Y + this.m_normals[0].Y * delta));
                this.m_destPoly.push(pt1);
              } else {
                k = 1;
                this.m_sinA = 0;
                if (node.m_endtype === ClipperLib2.EndType.etOpenSquare)
                  this.DoSquare(0, 1);
                else
                  this.DoRound(0, 1);
              }
              this.m_destPolys.push(this.m_destPoly);
            }
          }
        };
        ClipperLib2.ClipperOffset.prototype.Execute = function() {
          var a = arguments, ispolytree = a[0] instanceof ClipperLib2.PolyTree;
          if (!ispolytree) {
            var solution = a[0], delta = a[1];
            ClipperLib2.Clear(solution);
            this.FixOrientations();
            this.DoOffset(delta);
            var clpr = new ClipperLib2.Clipper(0);
            clpr.AddPaths(this.m_destPolys, ClipperLib2.PolyType.ptSubject, true);
            if (delta > 0) {
              clpr.Execute(ClipperLib2.ClipType.ctUnion, solution, ClipperLib2.PolyFillType.pftPositive, ClipperLib2.PolyFillType.pftPositive);
            } else {
              var r = ClipperLib2.Clipper.GetBounds(this.m_destPolys);
              var outer = new ClipperLib2.Path();
              outer.push(new ClipperLib2.IntPoint2(r.left - 10, r.bottom + 10));
              outer.push(new ClipperLib2.IntPoint2(r.right + 10, r.bottom + 10));
              outer.push(new ClipperLib2.IntPoint2(r.right + 10, r.top - 10));
              outer.push(new ClipperLib2.IntPoint2(r.left - 10, r.top - 10));
              clpr.AddPath(outer, ClipperLib2.PolyType.ptSubject, true);
              clpr.ReverseSolution = true;
              clpr.Execute(ClipperLib2.ClipType.ctUnion, solution, ClipperLib2.PolyFillType.pftNegative, ClipperLib2.PolyFillType.pftNegative);
              if (solution.length > 0)
                solution.splice(0, 1);
            }
          } else {
            var solution = a[0], delta = a[1];
            solution.Clear();
            this.FixOrientations();
            this.DoOffset(delta);
            var clpr = new ClipperLib2.Clipper(0);
            clpr.AddPaths(this.m_destPolys, ClipperLib2.PolyType.ptSubject, true);
            if (delta > 0) {
              clpr.Execute(ClipperLib2.ClipType.ctUnion, solution, ClipperLib2.PolyFillType.pftPositive, ClipperLib2.PolyFillType.pftPositive);
            } else {
              var r = ClipperLib2.Clipper.GetBounds(this.m_destPolys);
              var outer = new ClipperLib2.Path();
              outer.push(new ClipperLib2.IntPoint2(r.left - 10, r.bottom + 10));
              outer.push(new ClipperLib2.IntPoint2(r.right + 10, r.bottom + 10));
              outer.push(new ClipperLib2.IntPoint2(r.right + 10, r.top - 10));
              outer.push(new ClipperLib2.IntPoint2(r.left - 10, r.top - 10));
              clpr.AddPath(outer, ClipperLib2.PolyType.ptSubject, true);
              clpr.ReverseSolution = true;
              clpr.Execute(ClipperLib2.ClipType.ctUnion, solution, ClipperLib2.PolyFillType.pftNegative, ClipperLib2.PolyFillType.pftNegative);
              if (solution.ChildCount() === 1 && solution.Childs()[0].ChildCount() > 0) {
                var outerNode = solution.Childs()[0];
                solution.Childs()[0] = outerNode.Childs()[0];
                solution.Childs()[0].m_Parent = solution;
                for (var i = 1; i < outerNode.ChildCount(); i++)
                  solution.AddChild(outerNode.Childs()[i]);
              } else
                solution.Clear();
            }
          }
        };
        ClipperLib2.ClipperOffset.prototype.OffsetPoint = function(j, k, jointype) {
          this.m_sinA = this.m_normals[k].X * this.m_normals[j].Y - this.m_normals[j].X * this.m_normals[k].Y;
          if (Math.abs(this.m_sinA * this.m_delta) < 1) {
            var cosA = this.m_normals[k].X * this.m_normals[j].X + this.m_normals[j].Y * this.m_normals[k].Y;
            if (cosA > 0) {
              this.m_destPoly.push(new ClipperLib2.IntPoint2(
                ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
                ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)
              ));
              return k;
            }
          } else if (this.m_sinA > 1)
            this.m_sinA = 1;
          else if (this.m_sinA < -1)
            this.m_sinA = -1;
          if (this.m_sinA * this.m_delta < 0) {
            this.m_destPoly.push(new ClipperLib2.IntPoint2(
              ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
              ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)
            ));
            this.m_destPoly.push(new ClipperLib2.IntPoint1(this.m_srcPoly[j]));
            this.m_destPoly.push(new ClipperLib2.IntPoint2(
              ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
              ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)
            ));
          } else
            switch (jointype) {
              case ClipperLib2.JoinType.jtMiter: {
                var r = 1 + (this.m_normals[j].X * this.m_normals[k].X + this.m_normals[j].Y * this.m_normals[k].Y);
                if (r >= this.m_miterLim)
                  this.DoMiter(j, k, r);
                else
                  this.DoSquare(j, k);
                break;
              }
              case ClipperLib2.JoinType.jtSquare:
                this.DoSquare(j, k);
                break;
              case ClipperLib2.JoinType.jtRound:
                this.DoRound(j, k);
                break;
            }
          k = j;
          return k;
        };
        ClipperLib2.ClipperOffset.prototype.DoSquare = function(j, k) {
          var dx = Math.tan(Math.atan2(
            this.m_sinA,
            this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y
          ) / 4);
          this.m_destPoly.push(new ClipperLib2.IntPoint2(
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[k].X - this.m_normals[k].Y * dx)),
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[k].Y + this.m_normals[k].X * dx))
          ));
          this.m_destPoly.push(new ClipperLib2.IntPoint2(
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[j].X + this.m_normals[j].Y * dx)),
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[j].Y - this.m_normals[j].X * dx))
          ));
        };
        ClipperLib2.ClipperOffset.prototype.DoMiter = function(j, k, r) {
          var q = this.m_delta / r;
          this.m_destPoly.push(new ClipperLib2.IntPoint2(
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + (this.m_normals[k].X + this.m_normals[j].X) * q),
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + (this.m_normals[k].Y + this.m_normals[j].Y) * q)
          ));
        };
        ClipperLib2.ClipperOffset.prototype.DoRound = function(j, k) {
          var a = Math.atan2(
            this.m_sinA,
            this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y
          );
          var steps = Math.max(ClipperLib2.Cast_Int32(ClipperLib2.ClipperOffset.Round(this.m_StepsPerRad * Math.abs(a))), 1);
          var X = this.m_normals[k].X, Y = this.m_normals[k].Y, X2;
          for (var i = 0; i < steps; ++i) {
            this.m_destPoly.push(new ClipperLib2.IntPoint2(
              ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + X * this.m_delta),
              ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + Y * this.m_delta)
            ));
            X2 = X;
            X = X * this.m_cos - this.m_sin * Y;
            Y = X2 * this.m_sin + Y * this.m_cos;
          }
          this.m_destPoly.push(new ClipperLib2.IntPoint2(
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
            ClipperLib2.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)
          ));
        };
        ClipperLib2.Error = function(message) {
          try {
            throw new Error(message);
          } catch (err) {
            alert(err.message);
          }
        };
        ClipperLib2.JS = {};
        ClipperLib2.JS.AreaOfPolygon = function(poly, scale) {
          if (!scale) scale = 1;
          return ClipperLib2.Clipper.Area(poly) / (scale * scale);
        };
        ClipperLib2.JS.AreaOfPolygons = function(poly, scale) {
          if (!scale) scale = 1;
          var area = 0;
          for (var i = 0; i < poly.length; i++) {
            area += ClipperLib2.Clipper.Area(poly[i]);
          }
          return area / (scale * scale);
        };
        ClipperLib2.JS.BoundsOfPath = function(path, scale) {
          return ClipperLib2.JS.BoundsOfPaths([path], scale);
        };
        ClipperLib2.JS.BoundsOfPaths = function(paths, scale) {
          if (!scale) scale = 1;
          var bounds = ClipperLib2.Clipper.GetBounds(paths);
          bounds.left /= scale;
          bounds.bottom /= scale;
          bounds.right /= scale;
          bounds.top /= scale;
          return bounds;
        };
        ClipperLib2.JS.Clean = function(polygon, delta) {
          if (!(polygon instanceof Array)) return [];
          var isPolygons = polygon[0] instanceof Array;
          var polygon = ClipperLib2.JS.Clone(polygon);
          if (typeof delta !== "number" || delta === null) {
            ClipperLib2.Error("Delta is not a number in Clean().");
            return polygon;
          }
          if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || delta < 0) return polygon;
          if (!isPolygons) polygon = [polygon];
          var k_length = polygon.length;
          var len, poly, result, d, p, j, i;
          var results = [];
          for (var k = 0; k < k_length; k++) {
            poly = polygon[k];
            len = poly.length;
            if (len === 0) continue;
            else if (len < 3) {
              result = poly;
              results.push(result);
              continue;
            }
            result = poly;
            d = delta * delta;
            p = poly[0];
            j = 1;
            for (i = 1; i < len; i++) {
              if ((poly[i].X - p.X) * (poly[i].X - p.X) + (poly[i].Y - p.Y) * (poly[i].Y - p.Y) <= d)
                continue;
              result[j] = poly[i];
              p = poly[i];
              j++;
            }
            p = poly[j - 1];
            if ((poly[0].X - p.X) * (poly[0].X - p.X) + (poly[0].Y - p.Y) * (poly[0].Y - p.Y) <= d)
              j--;
            if (j < len)
              result.splice(j, len - j);
            if (result.length) results.push(result);
          }
          if (!isPolygons && results.length) results = results[0];
          else if (!isPolygons && results.length === 0) results = [];
          else if (isPolygons && results.length === 0) results = [
            []
          ];
          return results;
        };
        ClipperLib2.JS.Clone = function(polygon) {
          if (!(polygon instanceof Array)) return [];
          if (polygon.length === 0) return [];
          else if (polygon.length === 1 && polygon[0].length === 0) return [
            []
          ];
          var isPolygons = polygon[0] instanceof Array;
          if (!isPolygons) polygon = [polygon];
          var len = polygon.length, plen, i, j, result;
          var results = new Array(len);
          for (i = 0; i < len; i++) {
            plen = polygon[i].length;
            result = new Array(plen);
            for (j = 0; j < plen; j++) {
              result[j] = {
                X: polygon[i][j].X,
                Y: polygon[i][j].Y
              };
            }
            results[i] = result;
          }
          if (!isPolygons) results = results[0];
          return results;
        };
        ClipperLib2.JS.Lighten = function(polygon, tolerance) {
          if (!(polygon instanceof Array)) return [];
          if (typeof tolerance !== "number" || tolerance === null) {
            ClipperLib2.Error("Tolerance is not a number in Lighten().");
            return ClipperLib2.JS.Clone(polygon);
          }
          if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || tolerance < 0) {
            return ClipperLib2.JS.Clone(polygon);
          }
          var isPolygons = polygon[0] instanceof Array;
          if (!isPolygons) polygon = [polygon];
          var i, j, poly, k, poly2, plen, A, B, P, d, rem, addlast;
          var bxax, byay, l, ax, ay;
          var len = polygon.length;
          var toleranceSq = tolerance * tolerance;
          var results = [];
          for (i = 0; i < len; i++) {
            poly = polygon[i];
            plen = poly.length;
            if (plen === 0) continue;
            for (k = 0; k < 1e6; k++) {
              poly2 = [];
              plen = poly.length;
              if (poly[plen - 1].X !== poly[0].X || poly[plen - 1].Y !== poly[0].Y) {
                addlast = 1;
                poly.push(
                  {
                    X: poly[0].X,
                    Y: poly[0].Y
                  }
                );
                plen = poly.length;
              } else addlast = 0;
              rem = [];
              for (j = 0; j < plen - 2; j++) {
                A = poly[j];
                P = poly[j + 1];
                B = poly[j + 2];
                ax = A.X;
                ay = A.Y;
                bxax = B.X - ax;
                byay = B.Y - ay;
                if (bxax !== 0 || byay !== 0) {
                  l = ((P.X - ax) * bxax + (P.Y - ay) * byay) / (bxax * bxax + byay * byay);
                  if (l > 1) {
                    ax = B.X;
                    ay = B.Y;
                  } else if (l > 0) {
                    ax += bxax * l;
                    ay += byay * l;
                  }
                }
                bxax = P.X - ax;
                byay = P.Y - ay;
                d = bxax * bxax + byay * byay;
                if (d <= toleranceSq) {
                  rem[j + 1] = 1;
                  j++;
                }
              }
              poly2.push(
                {
                  X: poly[0].X,
                  Y: poly[0].Y
                }
              );
              for (j = 1; j < plen - 1; j++)
                if (!rem[j]) poly2.push(
                  {
                    X: poly[j].X,
                    Y: poly[j].Y
                  }
                );
              poly2.push(
                {
                  X: poly[plen - 1].X,
                  Y: poly[plen - 1].Y
                }
              );
              if (addlast) poly.pop();
              if (!rem.length) break;
              else poly = poly2;
            }
            plen = poly2.length;
            if (poly2[plen - 1].X === poly2[0].X && poly2[plen - 1].Y === poly2[0].Y) {
              poly2.pop();
            }
            if (poly2.length > 2)
              results.push(poly2);
          }
          if (!isPolygons) {
            results = results[0];
          }
          if (typeof results === "undefined") {
            results = [];
          }
          return results;
        };
        ClipperLib2.JS.PerimeterOfPath = function(path, closed, scale) {
          if (typeof path === "undefined") return 0;
          var sqrt = Math.sqrt;
          var perimeter = 0;
          var p1, p2, p1x = 0, p1y = 0, p2x = 0, p2y = 0;
          var j = path.length;
          if (j < 2) return 0;
          if (closed) {
            path[j] = path[0];
            j++;
          }
          while (--j) {
            p1 = path[j];
            p1x = p1.X;
            p1y = p1.Y;
            p2 = path[j - 1];
            p2x = p2.X;
            p2y = p2.Y;
            perimeter += sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
          }
          if (closed) path.pop();
          return perimeter / scale;
        };
        ClipperLib2.JS.PerimeterOfPaths = function(paths, closed, scale) {
          if (!scale) scale = 1;
          var perimeter = 0;
          for (var i = 0; i < paths.length; i++) {
            perimeter += ClipperLib2.JS.PerimeterOfPath(paths[i], closed, scale);
          }
          return perimeter;
        };
        ClipperLib2.JS.ScaleDownPath = function(path, scale) {
          var i, p;
          if (!scale) scale = 1;
          i = path.length;
          while (i--) {
            p = path[i];
            p.X = p.X / scale;
            p.Y = p.Y / scale;
          }
        };
        ClipperLib2.JS.ScaleDownPaths = function(paths, scale) {
          var i, j, p;
          if (!scale) scale = 1;
          i = paths.length;
          while (i--) {
            j = paths[i].length;
            while (j--) {
              p = paths[i][j];
              p.X = p.X / scale;
              p.Y = p.Y / scale;
            }
          }
        };
        ClipperLib2.JS.ScaleUpPath = function(path, scale) {
          var i, p, round3 = Math.round;
          if (!scale) scale = 1;
          i = path.length;
          while (i--) {
            p = path[i];
            p.X = round3(p.X * scale);
            p.Y = round3(p.Y * scale);
          }
        };
        ClipperLib2.JS.ScaleUpPaths = function(paths, scale) {
          var i, j, p, round3 = Math.round;
          if (!scale) scale = 1;
          i = paths.length;
          while (i--) {
            j = paths[i].length;
            while (j--) {
              p = paths[i][j];
              p.X = round3(p.X * scale);
              p.Y = round3(p.Y * scale);
            }
          }
        };
        ClipperLib2.ExPolygons = function() {
          return [];
        };
        ClipperLib2.ExPolygon = function() {
          this.outer = null;
          this.holes = null;
        };
        ClipperLib2.JS.AddOuterPolyNodeToExPolygons = function(polynode, expolygons) {
          var ep = new ClipperLib2.ExPolygon();
          ep.outer = polynode.Contour();
          var childs = polynode.Childs();
          var ilen = childs.length;
          ep.holes = new Array(ilen);
          var node, n, i, j, childs2, jlen;
          for (i = 0; i < ilen; i++) {
            node = childs[i];
            ep.holes[i] = node.Contour();
            for (j = 0, childs2 = node.Childs(), jlen = childs2.length; j < jlen; j++) {
              n = childs2[j];
              ClipperLib2.JS.AddOuterPolyNodeToExPolygons(n, expolygons);
            }
          }
          expolygons.push(ep);
        };
        ClipperLib2.JS.ExPolygonsToPaths = function(expolygons) {
          var a, i, alen, ilen;
          var paths = new ClipperLib2.Paths();
          for (a = 0, alen = expolygons.length; a < alen; a++) {
            paths.push(expolygons[a].outer);
            for (i = 0, ilen = expolygons[a].holes.length; i < ilen; i++) {
              paths.push(expolygons[a].holes[i]);
            }
          }
          return paths;
        };
        ClipperLib2.JS.PolyTreeToExPolygons = function(polytree) {
          var expolygons = new ClipperLib2.ExPolygons();
          var node, i, childs, ilen;
          for (i = 0, childs = polytree.Childs(), ilen = childs.length; i < ilen; i++) {
            node = childs[i];
            ClipperLib2.JS.AddOuterPolyNodeToExPolygons(node, expolygons);
          }
          return expolygons;
        };
      })();
    }
  });

  // src/geom.ts
  var EPS = 1e-9;
  function pt(x, y) {
    return { x, y };
  }
  function cloneVec(p) {
    return { x: p.x, y: p.y };
  }
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
  function dist2(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }
  function lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  function equals(a, b, tol = 1e-7) {
    return Math.abs(a.x - b.x) <= tol && Math.abs(a.y - b.y) <= tol;
  }
  function cloneSegment(s) {
    switch (s.kind) {
      case "line":
        return { kind: "line", p1: cloneVec(s.p1), p2: cloneVec(s.p2) };
      case "quad":
        return { kind: "quad", p1: cloneVec(s.p1), c: cloneVec(s.c), p2: cloneVec(s.p2) };
      case "cubic":
        return {
          kind: "cubic",
          p1: cloneVec(s.p1),
          c1: cloneVec(s.c1),
          c2: cloneVec(s.c2),
          p2: cloneVec(s.p2)
        };
    }
  }
  function clonePath(path) {
    return {
      segments: path.segments.map(cloneSegment),
      closed: path.closed,
      name: path.name,
      id: path.id,
      sourceId: path.sourceId
    };
  }
  function matrixApply(m, p) {
    return {
      x: m.a * p.x + m.c * p.y + m.e,
      y: m.b * p.x + m.d * p.y + m.f
    };
  }
  function matrixMultiply(m1, m2) {
    return {
      a: m1.a * m2.a + m1.c * m2.b,
      b: m1.b * m2.a + m1.d * m2.b,
      c: m1.a * m2.c + m1.c * m2.d,
      d: m1.b * m2.c + m1.d * m2.d,
      e: m1.a * m2.e + m1.c * m2.f + m1.e,
      f: m1.b * m2.e + m1.d * m2.f + m1.f
    };
  }
  function matrixTranslate(x, y) {
    return { a: 1, b: 0, c: 0, d: 1, e: x, f: y };
  }
  function matrixScale(sx, sy = sx) {
    return { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
  }
  function matrixRotate(radians) {
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
  }
  function transformPath(path, m) {
    const tp = (p) => matrixApply(m, p);
    return {
      ...path,
      segments: path.segments.map((s) => {
        switch (s.kind) {
          case "line":
            return { kind: "line", p1: tp(s.p1), p2: tp(s.p2) };
          case "quad":
            return { kind: "quad", p1: tp(s.p1), c: tp(s.c), p2: tp(s.p2) };
          case "cubic":
            return {
              kind: "cubic",
              p1: tp(s.p1),
              c1: tp(s.c1),
              c2: tp(s.c2),
              p2: tp(s.p2)
            };
        }
      })
    };
  }
  function distancePointToLine(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const l2 = abx * abx + aby * aby;
    if (l2 < EPS) return dist(p, a);
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
  }
  function flattenSegment(seg, tolerance, out, depth = 0) {
    const tol = Math.max(tolerance, 1e-6);
    if (seg.kind === "line") {
      out.push(cloneVec(seg.p2));
      return;
    }
    if (seg.kind === "quad") {
      const flat2 = Math.max(distancePointToLine(seg.c, seg.p1, seg.p2), 0);
      if (flat2 <= tol || depth >= 20) {
        out.push(cloneVec(seg.p2));
        return;
      }
      const m01 = lerp(seg.p1, seg.c, 0.5);
      const m12 = lerp(seg.c, seg.p2, 0.5);
      const mid2 = lerp(m01, m12, 0.5);
      flattenSegment({ kind: "quad", p1: seg.p1, c: m01, p2: mid2 }, tol, out, depth + 1);
      flattenSegment({ kind: "quad", p1: mid2, c: m12, p2: seg.p2 }, tol, out, depth + 1);
      return;
    }
    const flat = Math.max(
      distancePointToLine(seg.c1, seg.p1, seg.p2),
      distancePointToLine(seg.c2, seg.p1, seg.p2)
    );
    if (flat <= tol || depth >= 20) {
      out.push(cloneVec(seg.p2));
      return;
    }
    const p01 = lerp(seg.p1, seg.c1, 0.5);
    const p12 = lerp(seg.c1, seg.c2, 0.5);
    const p23 = lerp(seg.c2, seg.p2, 0.5);
    const p012 = lerp(p01, p12, 0.5);
    const p123 = lerp(p12, p23, 0.5);
    const mid = lerp(p012, p123, 0.5);
    flattenSegment({ kind: "cubic", p1: seg.p1, c1: p01, c2: p012, p2: mid }, tol, out, depth + 1);
    flattenSegment({ kind: "cubic", p1: mid, c1: p123, c2: p23, p2: seg.p2 }, tol, out, depth + 1);
  }
  function flattenPath(path, tolerance = 0.02) {
    const out = [];
    if (path.segments.length === 0) return out;
    out.push(cloneVec(path.segments[0].p1));
    for (const seg of path.segments) flattenSegment(seg, tolerance, out);
    return out;
  }
  function closedPolygon(path, tolerance = 0.02) {
    const pts = flattenPath(path, tolerance);
    if (pts.length > 1 && equals(pts[0], pts[pts.length - 1], 1e-6)) pts.pop();
    return pts;
  }
  function isClosedPath(path, tol = 1e-5) {
    if (path.closed) return true;
    if (path.segments.length === 0) return false;
    return equals(path.segments[0].p1, path.segments[path.segments.length - 1].p2, tol);
  }
  function polygonArea(points) {
    let a = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      a += points[j].x * points[i].y - points[i].x * points[j].y;
    }
    return a * 0.5;
  }
  function polygonPerimeter(points) {
    let l = 0;
    for (let i = 0; i < points.length; i++) {
      l += dist(points[i], points[(i + 1) % points.length]);
    }
    return l;
  }
  function pointInPolygon(points, p, includeBoundary = true) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i];
      const b = points[j];
      if (includeBoundary && distancePointToSegment(p, a, b) < 1e-7) return true;
      const intersects = a.y > p.y !== b.y > p.y && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y + (b.y === a.y ? 1e-30 : 0)) + a.x;
      if (intersects) inside = !inside;
    }
    return inside;
  }
  function distancePointToSegment(p, a, b) {
    return distancePointToLine(p, a, b);
  }
  function distanceToPolyline(p, points, closed = false) {
    let best = Infinity;
    const n = points.length;
    const count = closed ? n : n - 1;
    for (let i = 0; i < count; i++) {
      best = Math.min(best, distancePointToSegment(p, points[i], points[(i + 1) % n]));
    }
    if (n === 1) best = dist(p, points[0]);
    return best;
  }
  function polygonBounds(points) {
    if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return { minX, minY, maxX, maxY };
  }
  function ensureOrientation(points, ccw) {
    const isCcw = polygonArea(points) > 0;
    return isCcw === ccw ? points : points.slice().reverse();
  }
  function rotatePointsToStart(points, index) {
    if (points.length === 0) return points;
    const i = (index % points.length + points.length) % points.length;
    return points.slice(i).concat(points.slice(0, i));
  }
  function nearestPointIndex(points, target) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = dist2(points[i], target);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
  function dedupePoints(points, tol = 1e-6) {
    const out = [];
    for (const p of points) {
      if (out.length === 0 || !equals(out[out.length - 1], p, tol)) out.push(p);
    }
    if (out.length > 1 && equals(out[0], out[out.length - 1], tol)) out.pop();
    return out;
  }
  function svgArcToCubics(p1, rxIn, ryIn, xAxisRotationDeg, largeArc, sweep, p2) {
    let rx = Math.abs(rxIn);
    let ry = Math.abs(ryIn);
    if (rx < EPS || ry < EPS || equals(p1, p2)) {
      if (equals(p1, p2)) return [];
      return [{ kind: "cubic", p1, c1: lerp(p1, p2, 1 / 3), c2: lerp(p1, p2, 2 / 3), p2 }];
    }
    const phi = xAxisRotationDeg * Math.PI / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    const dx = (p1.x - p2.x) / 2;
    const dy = (p1.y - p2.y) / 2;
    const x1p = cosPhi * dx + sinPhi * dy;
    const y1p = -sinPhi * dx + cosPhi * dy;
    const lambda = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
    if (lambda > 1) {
      const s = Math.sqrt(lambda);
      rx *= s;
      ry *= s;
    }
    const sign = largeArc === sweep ? -1 : 1;
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const coef = sign * Math.sqrt(Math.max(0, num / den));
    const cxp = coef * (rx * y1p) / ry;
    const cyp = coef * -(ry * x1p) / rx;
    const cx = cosPhi * cxp - sinPhi * cyp + (p1.x + p2.x) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (p1.y + p2.y) / 2;
    const angle = (ux, uy, vx, vy) => {
      const dotv = ux * vx + uy * vy;
      const lenv = Math.hypot(ux, uy) * Math.hypot(vx, vy);
      let a = Math.acos(Math.max(-1, Math.min(1, dotv / (lenv || 1))));
      if (ux * vy - uy * vx < 0) a = -a;
      return a;
    };
    const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let delta = angle(
      (x1p - cxp) / rx,
      (y1p - cyp) / ry,
      (-x1p - cxp) / rx,
      (-y1p - cyp) / ry
    );
    if (!sweep && delta > 0) delta -= 2 * Math.PI;
    if (sweep && delta < 0) delta += 2 * Math.PI;
    const nseg = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
    const deltaSeg = delta / nseg;
    const out = [];
    let theta = theta1;
    const mapPoint2 = (th) => {
      const cosT = Math.cos(th);
      const sinT = Math.sin(th);
      return {
        x: cx + cosPhi * rx * cosT - sinPhi * ry * sinT,
        y: cy + sinPhi * rx * cosT + cosPhi * ry * sinT
      };
    };
    const mapDeriv = (th) => {
      const cosT = Math.cos(th);
      const sinT = Math.sin(th);
      return {
        x: -cosPhi * rx * sinT - sinPhi * ry * cosT,
        y: -sinPhi * rx * sinT + cosPhi * ry * cosT
      };
    };
    let start = p1;
    for (let i = 0; i < nseg; i++) {
      const theta2 = theta + deltaSeg;
      const end = mapPoint2(theta2);
      const k = 4 / 3 * Math.tan((theta2 - theta) / 4);
      const d1 = mapDeriv(theta);
      const d2 = mapDeriv(theta2);
      out.push({
        kind: "cubic",
        p1: start,
        c1: { x: start.x + k * d1.x, y: start.y + k * d1.y },
        c2: { x: end.x - k * d2.x, y: end.y - k * d2.y },
        p2: end
      });
      start = end;
      theta = theta2;
    }
    if (out.length > 0) out[out.length - 1].p2 = cloneVec(p2);
    return out;
  }
  function parseSvgPathData(d) {
    const tokens = d.match(/[a-zA-Z]|[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/g);
    if (!tokens) return [];
    const result = [];
    let current = null;
    let cur = { x: 0, y: 0 };
    let start = { x: 0, y: 0 };
    let lastCubicC2 = null;
    let lastQuadC = null;
    let command = "";
    let index = 0;
    const newSubPath = (p) => {
      if (current && current.segments.length > 0) result.push(current);
      current = { segments: [], closed: false };
      cur = cloneVec(p);
      start = cloneVec(p);
    };
    const ensure = () => {
      if (!current) newSubPath(cur);
      return current;
    };
    const isCommand = (t) => /^[a-zA-Z]$/.test(t);
    const takeNumber = () => {
      const t = tokens[index++];
      if (t === void 0 || isCommand(t)) throw new Error(`Expected number in path data near token ${index}`);
      return Number(t);
    };
    const hasNumber = () => {
      const t = tokens[index];
      return t !== void 0 && !isCommand(t);
    };
    while (index < tokens.length) {
      if (isCommand(tokens[index])) {
        command = tokens[index++];
      } else if (!command) {
        index++;
        continue;
      }
      if (!command) break;
      const rel = command === command.toLowerCase();
      const cmd = command.toUpperCase();
      const origin = (p) => rel ? { x: cur.x + p.x, y: cur.y + p.y } : p;
      const originXY = (x, y) => origin({ x, y });
      switch (cmd) {
        case "M": {
          const p = originXY(takeNumber(), takeNumber());
          newSubPath(p);
          command = rel ? "l" : "L";
          lastCubicC2 = lastQuadC = null;
          break;
        }
        case "L": {
          const p = originXY(takeNumber(), takeNumber());
          ensure().segments.push({ kind: "line", p1: cur, p2: p });
          cur = p;
          lastCubicC2 = lastQuadC = null;
          break;
        }
        case "H": {
          const x = takeNumber();
          const p = rel ? { x: cur.x + x, y: cur.y } : { x, y: cur.y };
          ensure().segments.push({ kind: "line", p1: cur, p2: p });
          cur = p;
          lastCubicC2 = lastQuadC = null;
          break;
        }
        case "V": {
          const y = takeNumber();
          const p = rel ? { x: cur.x, y: cur.y + y } : { x: cur.x, y };
          ensure().segments.push({ kind: "line", p1: cur, p2: p });
          cur = p;
          lastCubicC2 = lastQuadC = null;
          break;
        }
        case "C": {
          const c1 = originXY(takeNumber(), takeNumber());
          const c2 = originXY(takeNumber(), takeNumber());
          const p = originXY(takeNumber(), takeNumber());
          ensure().segments.push({ kind: "cubic", p1: cur, c1, c2, p2: p });
          cur = p;
          lastCubicC2 = c2;
          lastQuadC = null;
          break;
        }
        case "S": {
          const c2 = originXY(takeNumber(), takeNumber());
          const p = originXY(takeNumber(), takeNumber());
          const c1 = lastCubicC2 ? { x: 2 * cur.x - lastCubicC2.x, y: 2 * cur.y - lastCubicC2.y } : cloneVec(cur);
          ensure().segments.push({ kind: "cubic", p1: cur, c1, c2, p2: p });
          cur = p;
          lastCubicC2 = c2;
          lastQuadC = null;
          break;
        }
        case "Q": {
          const c = originXY(takeNumber(), takeNumber());
          const p = originXY(takeNumber(), takeNumber());
          ensure().segments.push({ kind: "quad", p1: cur, c, p2: p });
          cur = p;
          lastQuadC = c;
          lastCubicC2 = null;
          break;
        }
        case "T": {
          const p = originXY(takeNumber(), takeNumber());
          const c = lastQuadC ? { x: 2 * cur.x - lastQuadC.x, y: 2 * cur.y - lastQuadC.y } : cloneVec(cur);
          ensure().segments.push({ kind: "quad", p1: cur, c, p2: p });
          cur = p;
          lastQuadC = c;
          lastCubicC2 = null;
          break;
        }
        case "A": {
          const rx = takeNumber();
          const ry = takeNumber();
          const rot = takeNumber();
          const large = takeNumber() !== 0;
          const sweep = takeNumber() !== 0;
          const p = originXY(takeNumber(), takeNumber());
          const cubics = svgArcToCubics(cur, rx, ry, rot, large, sweep, p);
          ensure().segments.push(...cubics);
          cur = p;
          lastCubicC2 = lastQuadC = null;
          break;
        }
        case "Z": {
          const sp = ensure();
          if (sp.segments.length > 0 && !equals(cur, start, 1e-7)) {
            sp.segments.push({ kind: "line", p1: cur, p2: cloneVec(start) });
          }
          sp.closed = true;
          cur = cloneVec(start);
          lastCubicC2 = lastQuadC = null;
          if (index < tokens.length && !isCommand(tokens[index])) index++;
          break;
        }
        default:
          index++;
      }
      if (cmd === "M") {
      }
      if (!hasNumber() && index < tokens.length && !isCommand(tokens[index])) {
        break;
      }
    }
    if (current && current.segments.length > 0) result.push(current);
    return result;
  }
  var KAPPA = 0.5522847498307936;
  function rectPath(x, y, w, h) {
    return {
      closed: true,
      segments: [
        { kind: "line", p1: pt(x, y), p2: pt(x + w, y) },
        { kind: "line", p1: pt(x + w, y), p2: pt(x + w, y + h) },
        { kind: "line", p1: pt(x + w, y + h), p2: pt(x, y + h) },
        { kind: "line", p1: pt(x, y + h), p2: pt(x, y) }
      ]
    };
  }
  function roundedRectPath(x, y, w, h, r) {
    const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    if (rr < 1e-9) return rectPath(x, y, w, h);
    const k = KAPPA * rr;
    const segs = [];
    segs.push({ kind: "line", p1: pt(x + rr, y), p2: pt(x + w - rr, y) });
    segs.push({
      kind: "cubic",
      p1: pt(x + w - rr, y),
      c1: pt(x + w - rr + k, y),
      c2: pt(x + w, y + rr - k),
      p2: pt(x + w, y + rr)
    });
    segs.push({ kind: "line", p1: pt(x + w, y + rr), p2: pt(x + w, y + h - rr) });
    segs.push({
      kind: "cubic",
      p1: pt(x + w, y + h - rr),
      c1: pt(x + w, y + h - rr + k),
      c2: pt(x + w - rr + k, y + h),
      p2: pt(x + w - rr, y + h)
    });
    segs.push({ kind: "line", p1: pt(x + w - rr, y + h), p2: pt(x + rr, y + h) });
    segs.push({
      kind: "cubic",
      p1: pt(x + rr, y + h),
      c1: pt(x + rr - k, y + h),
      c2: pt(x, y + h - rr + k),
      p2: pt(x, y + h - rr)
    });
    segs.push({ kind: "line", p1: pt(x, y + h - rr), p2: pt(x, y + rr) });
    segs.push({
      kind: "cubic",
      p1: pt(x, y + rr),
      c1: pt(x, y + rr - k),
      c2: pt(x + rr - k, y),
      p2: pt(x + rr, y)
    });
    return { closed: true, segments: segs };
  }
  function ellipsePath(cx, cy, rx, ry) {
    const kx = KAPPA * rx;
    const ky = KAPPA * ry;
    const segs = [
      { kind: "cubic", p1: pt(cx + rx, cy), c1: pt(cx + rx, cy + ky), c2: pt(cx + kx, cy + ry), p2: pt(cx, cy + ry) },
      { kind: "cubic", p1: pt(cx, cy + ry), c1: pt(cx - kx, cy + ry), c2: pt(cx - rx, cy + ky), p2: pt(cx - rx, cy) },
      { kind: "cubic", p1: pt(cx - rx, cy), c1: pt(cx - rx, cy - ky), c2: pt(cx - kx, cy - ry), p2: pt(cx, cy - ry) },
      { kind: "cubic", p1: pt(cx, cy - ry), c1: pt(cx + kx, cy - ry), c2: pt(cx + rx, cy - ky), p2: pt(cx + rx, cy) }
    ];
    return { closed: true, segments: segs };
  }
  function polygonPath(cx, cy, radius, sides, startAngle = Math.PI / 2) {
    const n = Math.max(3, Math.floor(sides));
    const segs = [];
    let prev = pt(cx + radius * Math.cos(startAngle), cy + radius * Math.sin(startAngle));
    const first = prev;
    for (let i = 1; i < n; i++) {
      const a = startAngle + i * 2 * Math.PI / n;
      const p = pt(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
      segs.push({ kind: "line", p1: prev, p2: p });
      prev = p;
    }
    segs.push({ kind: "line", p1: prev, p2: first });
    return { closed: true, segments: segs };
  }
  function starPath(cx, cy, radius, points, pointinessPct) {
    const n = Math.max(3, Math.floor(points));
    const inner = radius * Math.max(0, Math.min(0.99, 1 - pointinessPct / 100));
    const segs = [];
    const angleStep = 2 * Math.PI / n;
    const start = -Math.PI / 2;
    let first = pt(cx + radius * Math.cos(start), cy + radius * Math.sin(start));
    let prev = first;
    for (let i = 1; i <= n; i++) {
      const aOuter = start + i * angleStep;
      const aInner = aOuter - angleStep / 2;
      const pInner = pt(cx + inner * Math.cos(aInner), cy + inner * Math.sin(aInner));
      segs.push({ kind: "line", p1: prev, p2: pInner });
      const pOuter = i === n ? first : pt(cx + radius * Math.cos(aOuter), cy + radius * Math.sin(aOuter));
      segs.push({ kind: "line", p1: pInner, p2: pOuter });
      prev = pOuter;
    }
    return { closed: true, segments: segs };
  }

  // src/cam.ts
  var import_clipper_lib = __toESM(require_clipper(), 1);
  var DEFAULT_PARAMS = (unit) => {
    const inch = unit === "in";
    return {
      toolDiameter: inch ? 0.25 * 25.4 : 6.35,
      targetDepth: inch ? -0.75 * 25.4 : -12,
      safetyHeight: inch ? 0.5 * 25.4 : 12,
      stockSurface: 0,
      stepdown: inch ? 0.05 * 25.4 : 2,
      feedrate: inch ? 60 * 25.4 : 800,
      plungerate: inch ? 30 * 25.4 : 300,
      outside: true,
      direction: 1,
      stepover: 0.4,
      roughingClearance: 0,
      center: true,
      spacing: inch ? 0.5 * 25.4 : 12.7,
      holeCount: 4,
      tabSpacing: inch ? 5 * 25.4 : 60,
      tabWidth: inch ? 0.25 * 25.4 : 6,
      tabHeight: inch ? 0.25 * 25.4 : 3
    };
  };
  var CLIPPER_SCALE = 1e3;
  var MIN_LOOP_AREA = 1e-5;
  function toClipper(points) {
    return points.map((p) => ({ X: Math.round(p.x * CLIPPER_SCALE), Y: Math.round(p.y * CLIPPER_SCALE) }));
  }
  function fromClipper(path) {
    return dedupePoints(path.map((p) => ({ x: p.X / CLIPPER_SCALE, y: p.Y / CLIPPER_SCALE })), 1e-6);
  }
  function clipperArea(path) {
    return import_clipper_lib.default.Clipper.Area(path) / (CLIPPER_SCALE * CLIPPER_SCALE);
  }
  function clipperReverse(path) {
    return path.slice().reverse();
  }
  function interiorPoint(points) {
    if (points.length < 3) return points[0] ?? { x: 0, y: 0 };
    const b = polygonBounds(points);
    const height = b.maxY - b.minY;
    const yCandidates = [b.minY + height * 0.5, b.minY + height * 0.37, b.minY + height * 0.61];
    for (const yBase of yCandidates) {
      const y = yBase + height * 1e-4;
      const xs = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const c2 = points[(i + 1) % points.length];
        if (a.y > y !== c2.y > y) {
          xs.push(a.x + (y - a.y) * (c2.x - a.x) / (c2.y - a.y));
        }
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const p = { x: (xs[i] + xs[i + 1]) / 2, y };
        if (pointInPolygon(points, p, false)) return p;
      }
    }
    const c = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: c.x / points.length, y: c.y / points.length };
  }
  function clipperIntersectionArea(a, b) {
    const clipper = new import_clipper_lib.default.Clipper();
    clipper.AddPath(toClipper(a), import_clipper_lib.default.PolyType.ptSubject, true);
    clipper.AddPath(toClipper(b), import_clipper_lib.default.PolyType.ptClip, true);
    const solution = new import_clipper_lib.default.Paths();
    clipper.Execute(
      import_clipper_lib.default.ClipType.ctIntersection,
      solution,
      import_clipper_lib.default.PolyFillType.pftNonZero,
      import_clipper_lib.default.PolyFillType.pftNonZero
    );
    let area = 0;
    for (const p of solution) area += Math.abs(clipperArea(p));
    return area;
  }
  function loopContains(outer, inner) {
    const ob = polygonBounds(outer);
    const ib = polygonBounds(inner);
    const eps = 1e-6;
    if (ib.minX < ob.minX - eps || ib.minY < ob.minY - eps || ib.maxX > ob.maxX + eps || ib.maxY > ob.maxY + eps) {
      return false;
    }
    const p = interiorPoint(inner);
    if (!pointInPolygon(outer, p, false)) return false;
    const innerArea = Math.abs(polygonArea(inner));
    const inter = clipperIntersectionArea(inner, outer);
    return inter >= innerArea - Math.max(1e-6, innerArea * 1e-6);
  }
  function computeNestingDepths(loops) {
    const bounds = loops.map((p) => polygonBounds(p));
    const points = loops.map((p) => interiorPoint(p));
    return loops.map((_, j) => {
      let depth = 0;
      for (let i = 0; i < loops.length; i++) {
        if (i === j) continue;
        const bi = bounds[i];
        const bj = bounds[j];
        if (bj.minX < bi.minX - 1e-6 || bj.minY < bi.minY - 1e-6 || bj.maxX > bi.maxX + 1e-6 || bj.maxY > bi.maxY + 1e-6) {
          continue;
        }
        if (!pointInPolygon(loops[i], points[j], false)) continue;
        if (loopContains(loops[i], loops[j])) depth++;
      }
      return depth;
    });
  }
  function simplifyPolygon(points) {
    const clipper = new import_clipper_lib.default.Clipper();
    clipper.AddPath(toClipper(points), import_clipper_lib.default.PolyType.ptSubject, true);
    const solution = new import_clipper_lib.default.Paths();
    clipper.Execute(
      import_clipper_lib.default.ClipType.ctUnion,
      solution,
      import_clipper_lib.default.PolyFillType.pftEvenOdd,
      import_clipper_lib.default.PolyFillType.pftEvenOdd
    );
    const result = [];
    for (const p of solution) {
      const pts = fromClipper(p);
      if (pts.length >= 3 && Math.abs(polygonArea(pts)) >= MIN_LOOP_AREA) result.push(pts);
    }
    return result;
  }
  function pathsToLoops(paths, tolerance) {
    const polygons = [];
    const sourceIds = [];
    for (const path of paths) {
      if (!isClosedPath(path)) continue;
      const pts = dedupePoints(closedPolygon(path, tolerance));
      if (pts.length < 3) continue;
      let loops = [];
      if (Math.abs(polygonArea(pts)) < MIN_LOOP_AREA) {
        loops = simplifyPolygon(pts);
      } else {
        loops = simplifyPolygon(pts);
        if (loops.length === 0) loops = [pts];
      }
      for (const loop of loops) {
        polygons.push(loop);
        sourceIds.push(path.id);
      }
    }
    if (polygons.length === 0) return [];
    const depths = computeNestingDepths(polygons);
    return polygons.map((pts, i) => {
      const depth = depths[i];
      return {
        points: ensureOrientation(pts, depth % 2 === 0),
        depth,
        closed: true,
        pocketDepth: 0,
        tabs: [],
        sourceId: sourceIds[i]
      };
    });
  }
  function pathsToFollowLoops(paths, tolerance) {
    const out = [];
    for (const path of paths) {
      let pts = dedupePoints(flattenPath(path, tolerance));
      if (pts.length < 2) continue;
      const closed = isClosedPath(path);
      if (closed && pts.length >= 3) {
        if (dist(pts[0], pts[pts.length - 1]) < 1e-6) pts = pts.slice(0, -1);
        out.push({ points: pts, depth: 0, closed: true, pocketDepth: 0, tabs: [], sourceId: path.id });
      } else {
        out.push({ points: pts, depth: 0, closed: false, pocketDepth: 0, tabs: [], sourceId: path.id });
      }
    }
    return out;
  }
  function distributeHoles(points, closed, count) {
    const n = points.length;
    const holes = Math.max(1, Math.floor(count));
    if (n === 0) return [];
    if (n === 1) return [{ ...points[0] }];
    const segmentCount = closed ? n : n - 1;
    const lengths = [];
    let total = 0;
    for (let i = 0; i < segmentCount; i++) {
      const l = dist(points[i], points[(i + 1) % n]);
      lengths.push(l);
      total += l;
    }
    if (!(total > 1e-9)) return [{ ...points[0] }];
    const fractions = [];
    if (closed) {
      for (let i = 0; i < holes; i++) fractions.push(i / holes);
    } else if (holes === 1) {
      fractions.push(0.5);
    } else {
      for (let i = 0; i < holes; i++) fractions.push(i / (holes - 1));
    }
    const result = [];
    for (const fraction of fractions) {
      let remaining = fraction * total;
      let index = 0;
      while (index < segmentCount - 1 && remaining > lengths[index]) {
        remaining -= lengths[index];
        index++;
      }
      const a = points[index];
      const b = points[(index + 1) % n];
      const t = lengths[index] > 1e-12 ? Math.min(1, Math.max(0, remaining / lengths[index])) : 0;
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return result;
  }
  function offsetRegion(loops, delta, arcTolerance = 0.01) {
    if (loops.length === 0) return [];
    const results = [];
    for (const loop of loops) {
      if (loop.points.length < 3) continue;
      let cp = toClipper(loop.points);
      if (cp.length < 3) continue;
      if (clipperArea(cp) < 0) cp = clipperReverse(cp);
      const d = (loop.depth % 2 === 0 ? delta : -delta) * CLIPPER_SCALE;
      const co = new import_clipper_lib.default.ClipperOffset(2, Math.max(0.5, arcTolerance * CLIPPER_SCALE));
      co.AddPath(cp, import_clipper_lib.default.JoinType.jtRound, import_clipper_lib.default.EndType.etClosedPolygon);
      const solution = new import_clipper_lib.default.Paths();
      co.Execute(solution, d);
      for (const p of solution) {
        if (loop.depth % 2 === 1) results.push(clipperReverse(p));
        else results.push(p);
      }
    }
    if (results.length === 0) return [];
    const clipper = new import_clipper_lib.default.Clipper();
    clipper.AddPaths(results, import_clipper_lib.default.PolyType.ptSubject, true);
    const merged = new import_clipper_lib.default.Paths();
    clipper.Execute(
      import_clipper_lib.default.ClipType.ctUnion,
      merged,
      import_clipper_lib.default.PolyFillType.pftNonZero,
      import_clipper_lib.default.PolyFillType.pftNonZero
    );
    const polygons = [];
    for (const p of merged) {
      const pts = fromClipper(p);
      if (pts.length < 3) continue;
      if (Math.abs(polygonArea(pts)) < MIN_LOOP_AREA) continue;
      polygons.push(pts);
    }
    if (polygons.length === 0) return [];
    const depths = computeNestingDepths(polygons);
    return polygons.map((pts, i) => ({
      points: ensureOrientation(pts, depths[i] % 2 === 0),
      depth: depths[i],
      closed: true,
      pocketDepth: 0,
      tabs: []
    }));
  }
  function applyDirection(loops, direction) {
    return loops.map((loop) => {
      const wantCcw = loop.depth % 2 === 0 ? direction === 1 : direction === 2;
      return { ...loop, points: ensureOrientation(loop.points, wantCcw) };
    });
  }
  function orderAndRotateLoops(loops) {
    const sorted = loops.slice().sort((a, b) => {
      if (a.pocketDepth !== b.pocketDepth) return a.pocketDepth - b.pocketDepth;
      if (a.depth !== b.depth) return a.depth - b.depth;
      return Math.abs(polygonArea(b.points)) - Math.abs(polygonArea(a.points));
    });
    let prevStart = null;
    return sorted.map((loop) => {
      let index;
      if (prevStart) {
        index = nearestPointIndex(loop.points, prevStart);
      } else {
        index = 0;
        for (let i = 1; i < loop.points.length; i++) {
          const p = loop.points[i];
          const best = loop.points[index];
          if (p.x > best.x + 1e-9 || Math.abs(p.x - best.x) <= 1e-9 && p.y > best.y) index = i;
        }
      }
      const points = rotatePointsToStart(loop.points, index);
      prevStart = points[0];
      return { ...loop, points };
    });
  }
  function addTabsToLoops(loops, spacing, width, height) {
    if (spacing <= 0 || width <= 0 || height <= 0) return loops;
    return loops.map((loop) => {
      const len = polygonPerimeter(loop.points);
      if (len <= 0) return loop;
      const tabs = [];
      const count = Math.floor(len / spacing);
      for (let i = 0; i < count; i++) {
        const start = i * spacing;
        if (start + width > len) break;
        tabs.push({ start, width, height });
      }
      return { ...loop, tabs };
    });
  }
  function generateToolpath(type, params, paths, tolerance) {
    const warnings = [];
    const radius = params.toolDiameter / 2;
    const selected = paths;
    if (type === "profile") {
      const input = pathsToLoops(selected, tolerance);
      if (input.length === 0) {
        return { loops: [], drillPoints: [], warnings: ["Select at least one closed path."] };
      }
      let result = offsetRegion(input, params.outside ? radius : -radius);
      if (result.length === 0) {
        warnings.push(
          params.outside ? "The offset produced no toolpath." : "Tool diameter is too large for the selected path."
        );
      }
      result = applyDirection(result, params.direction);
      if (params.tabSpacing > 0 && params.tabWidth > 0 && params.tabHeight > 0) {
        result = addTabsToLoops(result, params.tabSpacing, params.tabWidth, params.tabHeight);
      }
      return { loops: orderAndRotateLoops(result), drillPoints: [], warnings };
    }
    if (type === "pocket") {
      const input = pathsToLoops(selected, tolerance);
      if (input.length === 0) {
        return { loops: [], drillPoints: [], warnings: ["Select at least one closed path."] };
      }
      const stepoverDist = Math.max(0.01, params.stepover * params.toolDiameter);
      let current = offsetRegion(input, -(radius + params.roughingClearance));
      if (current.length === 0) {
        return {
          loops: [],
          drillPoints: [],
          warnings: ["Tool diameter and clearance are too large for the selected path."]
        };
      }
      const all = [];
      let level = 0;
      while (current.length > 0 && level < 2e3) {
        const levelLoops = applyDirection(current, params.direction).map((l) => ({
          ...l,
          pocketDepth: level
        }));
        all.push(...levelLoops);
        level++;
        current = offsetRegion(current, -stepoverDist);
      }
      return { loops: orderAndRotateLoops(all), drillPoints: [], warnings };
    }
    if (type === "follow") {
      const loops2 = pathsToFollowLoops(selected, tolerance);
      if (loops2.length === 0) {
        return { loops: [], drillPoints: [], warnings: ["Select at least one path."] };
      }
      return { loops: loops2.map((l) => ({ ...l, pocketDepth: 0 })), drillPoints: [], warnings };
    }
    if (type === "drillpath") {
      const followLoops = pathsToFollowLoops(selected, tolerance);
      if (followLoops.length === 0) {
        return { loops: [], drillPoints: [], warnings: ["Select at least one path."] };
      }
      const points2 = [];
      for (const loop of followLoops) {
        points2.push(...distributeHoles(loop.points, loop.closed, params.holeCount));
      }
      return { loops: [], drillPoints: points2, warnings };
    }
    const loops = pathsToLoops(selected, tolerance);
    if (loops.length === 0) {
      return { loops: [], drillPoints: [], warnings: ["Select at least one closed path."] };
    }
    const points = [];
    if (params.center || params.spacing === 0) {
      for (const loop of loops) {
        const b = polygonBounds(loop.points);
        points.push({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });
      }
    } else {
      const spacing = Math.abs(params.spacing);
      for (const loop of loops) {
        const b = polygonBounds(loop.points);
        for (let i = 1; i < b.maxX - b.minX; i += spacing) {
          for (let j = 1; j < b.maxY - b.minY; j += spacing) {
            const p = { x: b.minX + i, y: b.minY + j };
            if (pointInPolygon(loop.points, p, false)) points.push(p);
          }
        }
      }
      if (points.length === 0) warnings.push("The fill pattern produced no drill points.");
    }
    return { loops: [], drillPoints: points, warnings };
  }
  function polygonIntersectionArea(a, b) {
    const clipper = new import_clipper_lib.default.Clipper();
    clipper.AddPath(toClipper(a), import_clipper_lib.default.PolyType.ptSubject, true);
    clipper.AddPath(toClipper(b), import_clipper_lib.default.PolyType.ptClip, true);
    const solution = new import_clipper_lib.default.Paths();
    clipper.Execute(
      import_clipper_lib.default.ClipType.ctIntersection,
      solution,
      import_clipper_lib.default.PolyFillType.pftNonZero,
      import_clipper_lib.default.PolyFillType.pftNonZero
    );
    let area = 0;
    for (const p of solution) area += Math.abs(clipperArea(p));
    return area;
  }
  function polygonInsideArea(inner, outer) {
    const clipper = new import_clipper_lib.default.Clipper();
    clipper.AddPath(toClipper(inner), import_clipper_lib.default.PolyType.ptSubject, true);
    clipper.AddPath(toClipper(outer), import_clipper_lib.default.PolyType.ptClip, true);
    const solution = new import_clipper_lib.default.Paths();
    clipper.Execute(
      import_clipper_lib.default.ClipType.ctIntersection,
      solution,
      import_clipper_lib.default.PolyFillType.pftNonZero,
      import_clipper_lib.default.PolyFillType.pftNonZero
    );
    let area = 0;
    for (const p of solution) area += Math.abs(clipperArea(p));
    return area;
  }
  function rotatePoints(points, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return points.map((p) => ({ x: c * p.x - s * p.y, y: s * p.x + c * p.y }));
  }
  function translatePoints(points, x, y) {
    return points.map((p) => ({ x: p.x + x, y: p.y + y }));
  }
  function areaOf(points) {
    return Math.abs(polygonArea(points));
  }
  function nestItems(boundary, items, options) {
    const placements = [];
    const occupied = [];
    const bnd = polygonBounds(boundary);
    const boundaryArea = areaOf(boundary);
    const step = Math.max(options.step, 0.25);
    const order = items.map((item, index) => ({ index, area: areaOf(item.outline) })).sort((a, b) => b.area - a.area);
    for (const { index } of order) {
      const item = items[index];
      let best = null;
      for (const rot of options.rotations) {
        const rotated = rotatePoints(item.outline, rot);
        const rb = polygonBounds(rotated);
        const w = rb.maxX - rb.minX;
        const h = rb.maxY - rb.minY;
        if (w > bnd.maxX - bnd.minX || h > bnd.maxY - bnd.minY) continue;
        for (let y = bnd.minY; y + h <= bnd.maxY + 1e-6; y += step) {
          for (let x = bnd.minX; x + w <= bnd.maxX + 1e-6; x += step) {
            const placed = translatePoints(rotated, x - rb.minX, y - rb.minY);
            if (polygonInsideArea(placed, boundary) < areaOf(placed) - 1e-3) continue;
            let overlaps = false;
            for (const occ of occupied) {
              if (polygonIntersectionArea(placed, occ) > 1e-3) {
                overlaps = true;
                break;
              }
            }
            if (overlaps) continue;
            if (!best) best = { pos: { x: x - rb.minX, y: y - rb.minY }, rot, score: 0 };
            break;
          }
          if (best) break;
        }
        if (best) break;
      }
      if (best) {
        const rotated = rotatePoints(item.outline, best.rot);
        const placed = translatePoints(rotated, best.pos.x, best.pos.y);
        occupied.push(placed);
        placements.push({ index, position: best.pos, rotation: best.rot });
      }
    }
    const used = occupied.reduce((s, p) => s + areaOf(p), 0);
    if (boundaryArea > 0 && used / boundaryArea > 1.01) {
    }
    return placements;
  }

  // src/gcode.ts
  var LINE_END = "\r\n";
  function decimalsFor(unit, tolerance) {
    const tolInUnit = unit === "mm" ? tolerance : tolerance / 25.4;
    const digits = Math.ceil(-Math.log10(Math.max(tolInUnit, 1e-6))) + 1;
    return Math.max(2, Math.min(6, digits));
  }
  function formatNumber(n, decimals) {
    if (!Number.isFinite(n)) return "0";
    let s = n.toFixed(decimals);
    if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
    if (s === "-0") s = "0";
    return s;
  }
  function convertLength(mm, unit) {
    return unit === "in" ? mm / 25.4 : mm;
  }
  function fmtLength(mm, unit, decimals) {
    return formatNumber(convertLength(mm, unit), decimals);
  }
  function commentSafe(name) {
    return name.replace(/[()\r\n]/g, " ").trim();
  }
  function toolList(ops) {
    const tools = [];
    for (const op of ops) {
      if (!tools.some((t) => Math.abs(t - op.params.toolDiameter) < 1e-9)) {
        tools.push(op.params.toolDiameter);
      }
    }
    tools.sort((a, b) => b - a);
    return tools;
  }
  function emit(s, line) {
    s.lines.push(line + LINE_END);
  }
  function ensureTool(s, op, tools) {
    const tool = tools.findIndex((t) => Math.abs(t - op.params.toolDiameter) < 1e-9);
    if (tool !== s.currentTool) {
      emit(s, `T${tool} M6`);
      s.currentTool = tool;
    }
    if (!s.cutterOn) {
      emit(s, "G17");
      emit(s, "M3");
      s.cutterOn = true;
    }
  }
  function moveTo(s, p, docx, docy, withFeed) {
    const x = fmtLength(p.x + docx, s.unit, s.decimals);
    const y = fmtLength(p.y - docy, s.unit, s.decimals);
    let line = `G1 X${x} Y${y}`;
    if (withFeed !== void 0) {
      line += ` F${formatNumber(convertLength(withFeed, s.unit), s.feedDecimals)}`;
    }
    emit(s, line);
  }
  function rapidTo(s, p, docx, docy) {
    const x = fmtLength(p.x + docx, s.unit, s.decimals);
    const y = fmtLength(p.y - docy, s.unit, s.decimals);
    emit(s, `G0 X${x} Y${y}`);
  }
  function plungTo(s, zMm, plunge) {
    const z = fmtLength(zMm, s.unit, s.decimals);
    emit(s, `G1 Z${z} F${formatNumber(convertLength(plunge, s.unit), s.feedDecimals)}`);
  }
  function emitLoop(s, loop, depth, targetDepth, feedrate, plungerate, docx, docy) {
    const pts = loop.points;
    if (pts.length === 0) return;
    const tabTop = targetDepth;
    const activeTabs = loop.tabs.filter((t) => t.height > 0).map((t) => ({ start: t.start, end: t.start + t.width, top: targetDepth + t.height })).filter((t) => t.top > depth + 1e-9).sort((a, b) => a.start - b.start);
    let feedPending = true;
    let zState = depth;
    const doMove = (to) => {
      moveTo(s, to, docx, docy, feedPending ? feedrate : void 0);
      feedPending = false;
    };
    const setZ = (z) => {
      if (Math.abs(z - zState) > 1e-9) {
        plungTo(s, z, plungerate);
        zState = z;
        feedPending = true;
      }
    };
    if (!loop.closed) {
      for (let i = 1; i < pts.length; i++) doMove(pts[i]);
      return;
    }
    const n = pts.length;
    const lengths = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      const l = dist(pts[i], pts[(i + 1) % n]);
      lengths.push(l);
      total += l;
    }
    const startTab = activeTabs.find((t) => t.start <= 1e-9 && t.end > 1e-9);
    if (startTab) setZ(startTab.top);
    let sPos = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const segLen = lengths[i];
      const segStart = sPos;
      const segEnd = sPos + segLen;
      sPos = segEnd;
      const cuts = [];
      for (const tab of activeTabs) {
        if (tab.start > segStart + 1e-9 && tab.start < segEnd - 1e-9) {
          cuts.push({ at: (tab.start - segStart) / segLen, kind: "enter" });
        }
        if (tab.end > segStart + 1e-9 && tab.end < segEnd - 1e-9) {
          cuts.push({ at: (tab.end - segStart) / segLen, kind: "exit" });
        }
        if (Math.abs(tab.start - segStart) < 1e-9) {
          cuts.push({ at: 0, kind: "enter" });
        }
        if (Math.abs(tab.end - segStart) < 1e-9) {
          cuts.push({ at: 0, kind: "exit" });
        }
      }
      cuts.sort((x, y) => x.at - y.at || (x.kind === "enter" ? -1 : 1));
      let last = a;
      const tabAt = (pos) => activeTabs.find((t) => pos >= t.start - 1e-9 && pos < t.end - 1e-9);
      for (const cut of cuts) {
        const p = cut.at <= 1e-9 ? a : cut.at >= 1 - 1e-9 ? b : {
          x: a.x + (b.x - a.x) * cut.at,
          y: a.y + (b.y - a.y) * cut.at
        };
        if (dist(last, p) > 1e-9) doMove(p);
        if (cut.kind === "enter") setZ(tabAt(segStart + cut.at * segLen)?.top ?? tabTop);
        else setZ(depth);
        last = p;
      }
      if (dist(last, b) > 1e-9 || i === n - 1) doMove(b);
    }
    if (dist(pts[n - 1], pts[0]) > 1e-9) {
    }
    setZ(depth);
  }
  function processProfile(s, op, tools) {
    const p = op.params;
    if (op.loops.length === 0) return;
    emit(s, `(${commentSafe(op.name)})`);
    for (const loop of op.loops) {
      if (loop.points.length < 2) continue;
      emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
      ensureTool(s, op, tools);
      rapidTo(s, loop.points[0], 0, 0);
      let depth = p.stockSurface;
      while (depth > p.targetDepth + 1e-9) {
        depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
        depth = Number(depth.toFixed(6));
        plungTo(s, depth, p.plungerate);
        emitLoop(s, loop, depth, p.targetDepth, p.feedrate, p.plungerate, 0, 0);
      }
    }
  }
  function processPocket(s, op, tools) {
    const p = op.params;
    if (op.loops.length === 0) return;
    emit(s, `(${commentSafe(op.name)})`);
    let depth = p.stockSurface;
    while (depth > p.targetDepth + 1e-9) {
      depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
      depth = Number(depth.toFixed(6));
      for (const loop of op.loops) {
        if (loop.points.length < 2) continue;
        emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
        ensureTool(s, op, tools);
        rapidTo(s, loop.points[0], 0, 0);
        plungTo(s, depth, p.plungerate);
        emitLoop(s, loop, depth, p.targetDepth, p.feedrate, p.plungerate, 0, 0);
      }
    }
  }
  function processFollow(s, op, tools) {
    const p = op.params;
    if (op.loops.length === 0) return;
    emit(s, `(${commentSafe(op.name)})`);
    for (const loop of op.loops) {
      if (loop.points.length < 2) continue;
      let depth = p.stockSurface;
      while (depth > p.targetDepth + 1e-9) {
        depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
        depth = Number(depth.toFixed(6));
        emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
        ensureTool(s, op, tools);
        rapidTo(s, loop.points[0], 0, 0);
        plungTo(s, depth, p.plungerate);
        emitLoop(s, loop, depth, p.targetDepth, p.feedrate, p.plungerate, 0, 0);
      }
    }
  }
  function processDrill(s, op, tools) {
    const p = op.params;
    if (op.drillPoints.length === 0) return;
    emit(s, `(${commentSafe(op.name)})`);
    for (const point of op.drillPoints) {
      emit(s, `G0 Z${fmtLength(p.safetyHeight, s.unit, s.decimals)}`);
      ensureTool(s, op, tools);
      rapidTo(s, point, 0, 0);
      let depth = p.stockSurface;
      while (depth > p.targetDepth + 1e-9) {
        depth = Math.max(p.targetDepth, depth - Math.abs(p.stepdown));
        depth = Number(depth.toFixed(6));
        plungTo(s, depth, p.plungerate);
        emit(s, `G1 Z${fmtLength(p.stockSurface, s.unit, s.decimals)} F${formatNumber(convertLength(p.plungerate, s.unit), s.feedDecimals)}`);
      }
    }
  }
  function generateGcode(ops, unit, tolerance = 0.01) {
    const processed = ops.filter((op) => op.processed);
    if (processed.length === 0) return "";
    const tools = toolList(processed);
    const s = {
      lines: [],
      unit,
      decimals: decimalsFor(unit, tolerance),
      feedDecimals: unit === "in" ? 3 : 1,
      currentTool: -1,
      cutterOn: false
    };
    emit(s, "(Generated by MakerCam Modern, a port of PartKam by Jack Clark)");
    emit(s, unit === "in" ? "G20 G90 G40" : "G21 G90 G40");
    emit(s, "");
    for (const op of processed) {
      switch (op.type) {
        case "profile":
          processProfile(s, op, tools);
          break;
        case "pocket":
          processPocket(s, op, tools);
          break;
        case "follow":
          processFollow(s, op, tools);
          break;
        case "drill":
        case "drillpath":
          processDrill(s, op, tools);
          break;
      }
    }
    const lastSafety = processed.length > 0 ? processed[processed.length - 1].params.safetyHeight : 10;
    emit(s, `G0 Z${fmtLength(lastSafety, s.unit, s.decimals)}`);
    emit(s, "M5");
    emit(s, "M30");
    return s.lines.join("");
  }
  function estimateTime(op) {
    const p = op.params;
    let length = 0;
    for (const loop of op.loops) {
      length += loop.points.reduce((sum, pt3, i) => {
        if (!loop.closed && i === 0) return sum;
        return sum + dist(pt3, loop.points[(i + 1) % loop.points.length]);
      }, 0);
    }
    if (op.type === "drill" || op.type === "drillpath") {
      const depth2 = Math.abs(p.targetDepth - p.stockSurface);
      const pecks = Math.max(1, Math.ceil(depth2 / Math.abs(p.stepdown || 1)));
      const perHole = pecks * 2 * depth2;
      return op.drillPoints.length * perHole / Math.max(p.plungerate, 1);
    }
    const depth = Math.abs(p.targetDepth - p.stockSurface);
    const slices = Math.max(1, Math.ceil(depth / Math.abs(p.stepdown || 1)));
    const feed = Math.max(p.feedrate, 1);
    return length * slices / feed + slices * Math.max(1, op.loops.length) * 2 * p.safetyHeight / 2e3;
  }

  // src/svg.ts
  var MM_PER_IN = 25.4;
  function pxToMm(pxPerInch) {
    return MM_PER_IN / pxPerInch;
  }
  function parseLength(s) {
    if (s == null) return null;
    const m = String(s).trim().match(/^([+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?)\s*([a-zA-Z%]*)$/);
    if (!m) return null;
    const value = Number(m[1]);
    if (!Number.isFinite(value)) return null;
    return { value, unit: (m[2] || "").toLowerCase() };
  }
  function lengthToMm(l, pxPerInch, percentRef = 0) {
    if (!l) return null;
    const p = pxToMm(pxPerInch);
    switch (l.unit) {
      case "":
      case "px":
        return l.value * p;
      case "mm":
        return l.value;
      case "cm":
        return l.value * 10;
      case "in":
        return l.value * MM_PER_IN;
      case "pt":
        return l.value * MM_PER_IN / 72;
      case "pc":
        return l.value * MM_PER_IN / 6;
      case "%":
        return l.value / 100 * percentRef;
      default:
        return l.value * p;
    }
  }
  function userValue(s) {
    const l = parseLength(s);
    if (!l) return null;
    return l.value;
  }
  function parseTransformList(input) {
    if (!input) return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    let result = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
    let m;
    while (m = re.exec(input)) {
      const name = m[1];
      const nums = (m[2].match(/[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/g) || []).map(Number);
      let t = null;
      switch (name) {
        case "matrix":
          if (nums.length >= 6) t = { a: nums[0], b: nums[1], c: nums[2], d: nums[3], e: nums[4], f: nums[5] };
          break;
        case "translate":
          t = { a: 1, b: 0, c: 0, d: 1, e: nums[0] || 0, f: nums[1] || 0 };
          break;
        case "scale": {
          const sx = nums[0] ?? 1;
          const sy = nums[1] ?? sx;
          t = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 };
          break;
        }
        case "rotate": {
          const ang = (nums[0] || 0) * Math.PI / 180;
          const cx = nums[1] || 0;
          const cy = nums[2] || 0;
          const c = Math.cos(ang);
          const s = Math.sin(ang);
          const rot = { a: c, b: s, c: -s, d: c, e: 0, f: 0 };
          const toOrigin = { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy };
          const back = { a: 1, b: 0, c: 0, d: 1, e: cx, f: cy };
          t = matrixMultiply(matrixMultiply(back, rot), toOrigin);
          break;
        }
        case "skewX":
          t = { a: 1, b: 0, c: Math.tan((nums[0] || 0) * Math.PI / 180), d: 1, e: 0, f: 0 };
          break;
        case "skewY":
          t = { a: 1, b: Math.tan((nums[0] || 0) * Math.PI / 180), c: 0, d: 1, e: 0, f: 0 };
          break;
      }
      if (t) result = matrixMultiply(result, t);
    }
    return result;
  }
  function elementLocalName(el) {
    return (el.localName || el.nodeName || "").toLowerCase();
  }
  function shapeToPath(el) {
    const tag = elementLocalName(el);
    const num = (name, fallback = 0) => {
      const v = userValue(el.getAttribute(name));
      return v === null ? fallback : v;
    };
    switch (tag) {
      case "path": {
        const d = el.getAttribute("d");
        if (!d) return null;
        const subs = parseSvgPathData(d);
        if (subs.length === 0) return null;
        return null;
      }
      case "rect": {
        const x = num("x");
        const y = num("y");
        const w = num("width");
        const h = num("height");
        if (w <= 0 || h <= 0) return null;
        let rx = num("rx", NaN);
        let ry = num("ry", NaN);
        if (Number.isNaN(rx) && Number.isNaN(ry)) return rectPath(x, y, w, h);
        if (Number.isNaN(rx)) rx = ry;
        if (Number.isNaN(ry)) ry = rx;
        if (rx <= 0 || ry <= 0) return rectPath(x, y, w, h);
        const r = Math.min(rx, ry);
        return roundedRectPath(x, y, w, h, r);
      }
      case "circle": {
        const cx = num("cx");
        const cy = num("cy");
        const r = num("r");
        if (r <= 0) return null;
        return ellipsePath(cx, cy, r, r);
      }
      case "ellipse": {
        const cx = num("cx");
        const cy = num("cy");
        const rx = num("rx");
        const ry = num("ry");
        if (rx <= 0 || ry <= 0) return null;
        return ellipsePath(cx, cy, rx, ry);
      }
      case "line": {
        const x1 = num("x1");
        const y1 = num("y1");
        const x2 = num("x2");
        const y2 = num("y2");
        return { closed: false, segments: [{ kind: "line", p1: pt(x1, y1), p2: pt(x2, y2) }] };
      }
      case "polyline":
      case "polygon": {
        const raw = el.getAttribute("points");
        if (!raw) return null;
        const nums = (raw.match(/[+-]?(?:(?:\d+\.?\d*)|(?:\.\d+))(?:[eE][+-]?\d+)?/g) || []).map(Number);
        if (nums.length < 4) return null;
        const segments = [];
        let prev = pt(nums[0], nums[1]);
        const first = prev;
        for (let i = 2; i + 1 < nums.length; i += 2) {
          const p = pt(nums[i], nums[i + 1]);
          segments.push({ kind: "line", p1: prev, p2: p });
          prev = p;
        }
        const closed = tag === "polygon";
        if (closed) segments.push({ kind: "line", p1: prev, p2: first });
        return { closed, segments };
      }
    }
    return null;
  }
  function parseSvg(text, options = {}) {
    const pxPerInch = options.pxPerInch ?? 96;
    const warnings = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error("The file is not valid SVG: " + (parseError.textContent || "").slice(0, 200));
    }
    const root = doc.documentElement;
    if (!root || elementLocalName(root) !== "svg") {
      throw new Error("The file does not contain an <svg> root element.");
    }
    const viewBoxAttr = root.getAttribute("viewBox");
    const viewBox = viewBoxAttr ? viewBoxAttr.trim().split(/[\s,]+/).map(Number) : null;
    const hasViewBox = !!viewBox && viewBox.length === 4 && viewBox.every((n) => Number.isFinite(n));
    const widthLen = parseLength(root.getAttribute("width"));
    const heightLen = parseLength(root.getAttribute("height"));
    const vbX = hasViewBox ? viewBox[0] : 0;
    const vbY = hasViewBox ? viewBox[1] : 0;
    const vbW = hasViewBox ? viewBox[2] : 0;
    const vbH = hasViewBox ? viewBox[3] : 0;
    let widthMm = lengthToMm(widthLen, pxPerInch) ?? 0;
    let heightMm = lengthToMm(heightLen, pxPerInch) ?? 0;
    if (hasViewBox && vbW > 0 && vbH > 0) {
      if (widthMm <= 0 && heightMm > 0) widthMm = heightMm * vbW / vbH;
      if (heightMm <= 0 && widthMm > 0) heightMm = widthMm * vbH / vbW;
      if (widthMm <= 0 && heightMm <= 0) {
        widthMm = vbW * pxToMm(pxPerInch);
        heightMm = vbH * pxToMm(pxPerInch);
      }
    } else {
      if (widthMm <= 0) widthMm = 100 * pxToMm(pxPerInch);
      if (heightMm <= 0) heightMm = 100 * pxToMm(pxPerInch);
    }
    let rootMatrix;
    if (hasViewBox && vbW > 0 && vbH > 0) {
      const scaleX = widthMm / vbW;
      const scaleY = heightMm / vbH;
      const preserve = (root.getAttribute("preserveAspectRatio") || "xMidYMid meet").trim();
      const useUniform = !preserve.startsWith("none");
      const s = useUniform ? Math.min(scaleX, scaleY) : 1;
      const sx = useUniform ? s : scaleX;
      const sy = useUniform ? s : scaleY;
      const drawnW = vbW * sx;
      const drawnH = vbH * sy;
      let offsetX = 0;
      let offsetY = 0;
      if (useUniform) {
        const align = preserve.startsWith("xMax") ? "max" : preserve.startsWith("xMin") ? "min" : "mid";
        const alignY = preserve.includes("YMax") ? "max" : preserve.includes("YMin") ? "min" : "mid";
        if (align === "mid") offsetX = (widthMm - drawnW) / 2;
        else if (align === "max") offsetX = widthMm - drawnW;
        if (alignY === "mid") offsetY = (heightMm - drawnH) / 2;
        else if (alignY === "max") offsetY = heightMm - drawnH;
      }
      rootMatrix = {
        a: sx,
        b: 0,
        c: 0,
        d: -sy,
        e: offsetX - vbX * sx,
        f: heightMm - offsetY + vbY * sy
      };
    } else {
      const s = pxToMm(pxPerInch);
      rootMatrix = { a: s, b: 0, c: 0, d: -s, e: 0, f: heightMm };
    }
    const idMap = /* @__PURE__ */ new Map();
    const all = root.querySelectorAll("*");
    all.forEach((el) => {
      const id = el.getAttribute("id");
      if (id) idMap.set(id, el);
    });
    const paths = [];
    let pathCounter = 0;
    const addPath = (p, m, sourceId) => {
      const transformed = transformPath(p, m);
      if (transformed.segments.length === 0) return;
      pathCounter++;
      transformed.id = `p${pathCounter}`;
      transformed.name = sourceId || transformed.name || `path ${pathCounter}`;
      transformed.sourceId = sourceId;
      paths.push(transformed);
    };
    const walk = (el, parentMatrix, depth, seenUse) => {
      if (depth > 80) {
        warnings.push("SVG nesting is too deep; some elements were skipped.");
        return;
      }
      const tag = elementLocalName(el);
      if (["defs", "metadata", "title", "desc", "style", "script", "clipPath", "mask", "filter", "linearGradient", "radialGradient", "pattern", "marker", "symbol"].includes(tag)) {
        return;
      }
      const styleAttr = el.getAttribute("style") || "";
      if (el.getAttribute("display") === "none" || /(?:^|;)\s*display\s*:\s*none\b/i.test(styleAttr) || /(?:^|;)\s*visibility\s*:\s*hidden\b/i.test(styleAttr)) {
        return;
      }
      let local = parseTransformList(el.getAttribute("transform"));
      const styleTransform = /(?:^|;)\s*transform\s*:\s*([^;]+)/i.exec(styleAttr);
      if (styleTransform) {
        local = matrixMultiply(local, parseTransformList(styleTransform[1]));
      }
      let matrix = matrixMultiply(parentMatrix, local);
      if (tag === "svg" && el !== root) {
        const x = userValue(el.getAttribute("x")) ?? 0;
        const y = userValue(el.getAttribute("y")) ?? 0;
        matrix = matrixMultiply(matrix, { a: 1, b: 0, c: 0, d: 1, e: x, f: y });
      }
      if (tag === "use") {
        const href = el.getAttribute("href") || el.getAttributeNS("http://www.w3.org/1999/xlink", "href");
        const id = href && href.startsWith("#") ? href.slice(1) : null;
        const target = id ? idMap.get(id) : null;
        if (!target) {
          warnings.push("A <use> element references a missing shape.");
          return;
        }
        if (seenUse.has(target)) {
          warnings.push("A recursive <use> reference was skipped.");
          return;
        }
        const x = userValue(el.getAttribute("x")) ?? 0;
        const y = userValue(el.getAttribute("y")) ?? 0;
        const useMatrix = matrixMultiply(matrix, { a: 1, b: 0, c: 0, d: 1, e: x, f: y });
        const nextSeen = new Set(seenUse);
        nextSeen.add(target);
        walk(target, useMatrix, depth + 1, nextSeen);
        return;
      }
      if (tag === "g" || tag === "svg" || tag === "a" || tag === "switch") {
        const children = Array.from(el.children);
        for (const child of children) walk(child, matrix, depth + 1, seenUse);
        return;
      }
      if (tag === "path") {
        const d = el.getAttribute("d");
        if (!d) return;
        let subs;
        try {
          subs = parseSvgPathData(d);
        } catch (e) {
          warnings.push(`Could not parse a path: ${e.message}`);
          return;
        }
        const id = el.getAttribute("id") || void 0;
        let i = 0;
        for (const sub of subs) {
          if (sub.segments.length === 0) continue;
          addPath({ segments: sub.segments, closed: sub.closed, sourceId: id }, matrix, id);
          i++;
        }
        return;
      }
      if (["rect", "circle", "ellipse", "line", "polyline", "polygon"].includes(tag)) {
        const p = shapeToPath(el);
        if (p) addPath(p, matrix, el.getAttribute("id") || void 0);
        return;
      }
      if (tag === "text" || tag === "tspan") {
        warnings.push("Text elements are not converted (convert text to paths in your SVG editor).");
        return;
      }
      if (tag === "image") {
        warnings.push("Raster images inside the SVG are ignored.");
        return;
      }
      for (const child of Array.from(el.children)) walk(child, matrix, depth + 1, seenUse);
    };
    walk(root, rootMatrix, 0, /* @__PURE__ */ new Set());
    if (paths.length === 0) {
      warnings.push("No supported geometry was found in the SVG.");
    }
    return {
      paths,
      warnings,
      widthMm,
      heightMm,
      sourceWidth: vbW || widthMm,
      sourceHeight: vbH || heightMm,
      hasViewBox
    };
  }
  function pathToSvgD(path, map) {
    if (path.segments.length === 0) return "";
    const m = (p) => {
      const q = map(p);
      return `${round(q.x)} ${round(q.y)}`;
    };
    const parts = [`M${m(path.segments[0].p1)}`];
    for (const seg of path.segments) {
      switch (seg.kind) {
        case "line":
          parts.push(`L${m(seg.p2)}`);
          break;
        case "quad":
          parts.push(`Q${m(seg.c)} ${m(seg.p2)}`);
          break;
        case "cubic":
          parts.push(`C${m(seg.c1)} ${m(seg.c2)} ${m(seg.p2)}`);
          break;
      }
    }
    if (path.closed) parts.push("Z");
    return parts.join(" ");
  }
  function round(n) {
    return Math.round(n * 1e4) / 1e4;
  }

  // src/sample.ts
  var EXAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="140mm" height="90mm" viewBox="0 0 140 90">
  <rect id="outline" x="10" y="10" width="120" height="70" rx="8" ry="8"/>
  <rect id="pocket" x="30" y="25" width="80" height="40" rx="6" ry="6"/>
  <circle id="hole1" cx="50" cy="45" r="5"/>
  <circle id="hole2" cx="90" cy="45" r="5"/>
</svg>`;

  // src/project.ts
  function escapeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  function round2(n, decimals = 4) {
    const f = Math.pow(10, decimals);
    return Math.round(n * f) / f;
  }
  function allBounds(paths) {
    let b = null;
    for (const p of paths) {
      for (const q of flattenPath(p, 0.05)) {
        if (!b) b = { minX: q.x, minY: q.y, maxX: q.x, maxY: q.y };
        else {
          b.minX = Math.min(b.minX, q.x);
          b.minY = Math.min(b.minY, q.y);
          b.maxX = Math.max(b.maxX, q.x);
          b.maxY = Math.max(b.maxY, q.y);
        }
      }
    }
    return b ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  var PARAM_KEYS = [
    "toolDiameter",
    "targetDepth",
    "safetyHeight",
    "stockSurface",
    "stepdown",
    "feedrate",
    "plungerate",
    "outside",
    "direction",
    "stepover",
    "roughingClearance",
    "center",
    "spacing",
    "holeCount",
    "tabSpacing",
    "tabWidth",
    "tabHeight"
  ];
  function serializeProject(paths, operations, unit = "mm") {
    const b = allBounds(paths);
    const w = Math.max(b.maxX - b.minX, 1e-3);
    const h = Math.max(b.maxY - b.minY, 1e-3);
    const map = (p) => ({ x: p.x - b.minX, y: b.maxY - p.y });
    const lines = [];
    lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    lines.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${round2(w)}mm" height="${round2(h)}mm" viewBox="0 0 ${round2(w)} ${round2(h)}">`
    );
    lines.push("  <metadata>");
    lines.push(
      `    <partkam-project version="2" unit="mm" width="${round2(w)}" height="${round2(h)}">`
    );
    for (const op of operations) {
      const attrs = [
        `id="${escapeXml(op.id ?? "")}"`,
        `type="${op.type}"`,
        `name="${escapeXml(op.name)}"`
      ];
      for (const key of PARAM_KEYS) {
        const v = op.params[key];
        if (typeof v === "boolean") attrs.push(`${key}="${v}"`);
        else if (typeof v === "number" && Number.isFinite(v)) attrs.push(`${key}="${round2(v, 6)}"`);
      }
      lines.push(`      <partkam-operation ${attrs.join(" ")}>`);
      for (const pathId of op.pathIds) {
        lines.push(`        <partkam-path ref="${escapeXml(pathId)}"/>`);
      }
      lines.push("      </partkam-operation>");
    }
    lines.push("    </partkam-project>");
    lines.push("  </metadata>");
    lines.push("  <!-- Generated by MakerCam Modern (a port of PartKam by Jack Clark) -->");
    for (const p of paths) {
      const id = p.id || "path";
      const d = pathToSvgD(p, map);
      if (!d) continue;
      lines.push(
        `  <path id="${escapeXml(id)}" d="${escapeXml(d)}" fill="none" stroke="#000000" stroke-width="0.2"/>`
      );
    }
    lines.push("</svg>");
    return lines.join("\n");
  }
  function readNumber(el, name, fallback) {
    const v = el.getAttribute(name);
    if (v == null || v === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  function readBoolean(el, name, fallback) {
    const v = el.getAttribute(name);
    if (v == null) return fallback;
    return v === "true";
  }
  function readDirection(el, fallback) {
    const v = el.getAttribute("direction");
    return v === "2" ? 2 : v === "1" ? 1 : fallback;
  }
  function elementLocalName2(el) {
    return (el.localName || el.nodeName || "").toLowerCase();
  }
  function pathMapBySource(paths) {
    const map = /* @__PURE__ */ new Map();
    for (const p of paths) {
      const keys = [p.id, p.sourceId, p.name].filter(Boolean);
      for (const k of keys) {
        const list = map.get(k) ?? [];
        list.push(p);
        map.set(k, list);
      }
    }
    return map;
  }
  function parseProject(text, options = {}) {
    const imported = parseSvg(text, options);
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "image/svg+xml");
    if (doc.querySelector("parsererror")) return null;
    const metadataEls = Array.from(doc.getElementsByTagName("*")).filter(
      (el) => elementLocalName2(el) === "metadata"
    );
    if (metadataEls.length === 0) return null;
    const projectEl = Array.from(doc.getElementsByTagName("*")).find(
      (el) => elementLocalName2(el) === "partkam-project"
    );
    const pathMap = pathMapBySource(imported.paths);
    const warnings = [...imported.warnings];
    if (projectEl) {
      const operations2 = [];
      const opEls = Array.from(projectEl.getElementsByTagName("*")).filter(
        (el) => elementLocalName2(el) === "partkam-operation"
      );
      for (const el of opEls) {
        const type = el.getAttribute("type") || "profile";
        const params = { ...DEFAULT_PARAMS("mm") };
        for (const key of PARAM_KEYS) {
          const attr = el.getAttribute(key);
          if (attr == null) continue;
          if (key === "outside" || key === "center") {
            params[key] = attr === "true";
          } else if (key === "direction") {
            params.direction = attr === "2" ? 2 : 1;
          } else {
            const n = Number(attr);
            if (Number.isFinite(n)) params[key] = n;
          }
        }
        const refs = Array.from(el.getElementsByTagName("*")).filter((c) => elementLocalName2(c) === "partkam-path").map((c) => c.getAttribute("ref") || "").filter(Boolean);
        const pathIds = [];
        for (const ref of refs) {
          const found = pathMap.get(ref);
          if (found && found.length > 0) {
            for (const p of found) if (p.id && !pathIds.includes(p.id)) pathIds.push(p.id);
          } else {
            warnings.push(`Saved operation "${el.getAttribute("name") || ""}" references a missing path.`);
          }
        }
        operations2.push({
          id: el.getAttribute("id") || `op${operations2.length + 1}`,
          type,
          name: el.getAttribute("name") || `${type} ${operations2.length + 1}`,
          params,
          pathIds
        });
      }
      return {
        paths: imported.paths,
        operations: operations2,
        unit: "mm",
        widthMm: imported.widthMm,
        heightMm: imported.heightMm,
        warnings
      };
    }
    const cutEls = Array.from(doc.getElementsByTagName("*")).filter(
      (el) => elementLocalName2(el) === "cutobject"
    );
    if (cutEls.length === 0) return null;
    const operations = [];
    for (const el of cutEls) {
      const type = el.getAttribute("type") || "profile";
      const sourceUnit = (el.getAttribute("unit") || "imperial").toLowerCase();
      const metric = sourceUnit === "metric";
      const params = { ...DEFAULT_PARAMS("mm") };
      const machScale = metric ? 1 : 25.4;
      const toolScale = metric ? 10 : 25.4;
      params.safetyHeight = readNumber(el, "safetyheight", 0) * machScale;
      params.stockSurface = readNumber(el, "stocksurface", 0) * machScale;
      params.targetDepth = readNumber(el, "targetdepth", 0) * machScale;
      params.stepdown = Math.abs(readNumber(el, "stepdown", 1)) * machScale || 1;
      params.feedrate = Math.abs(readNumber(el, "feedrate", 1)) * machScale || 1;
      params.plungerate = Math.abs(readNumber(el, "plungerate", 1)) * machScale || 1;
      params.toolDiameter = Math.abs(readNumber(el, "tooldiameter", 1)) * toolScale;
      params.roughingClearance = Math.abs(readNumber(el, "roughingclearance", 0)) * toolScale;
      params.stepover = Math.abs(readNumber(el, "stepover", 0.4));
      if (params.stepover > 1) params.stepover /= 100;
      params.outside = readBoolean(el, "outside", true);
      params.direction = readDirection(el, 1);
      params.center = readBoolean(el, "center", true);
      params.spacing = Math.abs(readNumber(el, "spacing", 0)) * toolScale;
      params.tabSpacing = 0;
      params.tabWidth = 0;
      params.tabHeight = 0;
      const refs = Array.from(el.getElementsByTagName("*")).filter((c) => elementLocalName2(c) === "path").map((c) => (c.textContent || "").trim()).filter(Boolean);
      const pathIds = [];
      for (const ref of refs) {
        const found = pathMap.get(ref);
        if (found) {
          for (const p of found) if (p.id && !pathIds.includes(p.id)) pathIds.push(p.id);
        }
      }
      operations.push({
        id: `op${operations.length + 1}`,
        type,
        name: el.getAttribute("name") || `${type} ${operations.length + 1}`,
        params,
        pathIds
      });
    }
    return {
      paths: imported.paths,
      operations,
      unit: "mm",
      widthMm: imported.widthMm,
      heightMm: imported.heightMm,
      warnings
    };
  }
  function downloadText(filename, text, mime = "text/plain") {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }

  // src/render.ts
  function worldToScreen(view, p) {
    return { x: view.panX + p.x * view.zoom, y: view.panY - p.y * view.zoom };
  }
  function screenToWorld(view, p) {
    return { x: (p.x - view.panX) / view.zoom, y: (view.panY - p.y) / view.zoom };
  }
  function fitView(bounds, width, height, margin = 48) {
    const w = Math.max(bounds.maxX - bounds.minX, 1e-3);
    const h = Math.max(bounds.maxY - bounds.minY, 1e-3);
    const zoom = Math.min((width - margin * 2) / w, (height - margin * 2) / h);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    return {
      zoom,
      panX: width / 2 - cx * zoom,
      panY: height / 2 + cy * zoom
    };
  }
  var COLORS = {
    bg: "#fafaf7",
    gridMinor: "#ecece4",
    gridMajor: "#dcdcd0",
    axis: "#c2c2b4",
    path: "#343d49",
    pathHover: "#1d6fb8",
    pathSelected: "#0a84ff",
    pathReferenced: "#8a97a6",
    profile: "#12824c",
    pocket: "#c77c08",
    follow: "#7c3aed",
    drill: "#d62828",
    drillpath: "#be185d",
    selected: "#0a84ff",
    arrow: "#ffffff",
    tab: "#0f766e"
  };
  function opColor(type) {
    switch (type) {
      case "profile":
        return COLORS.profile;
      case "pocket":
        return COLORS.pocket;
      case "follow":
        return COLORS.follow;
      case "drill":
        return COLORS.drill;
      case "drillpath":
        return COLORS.drillpath;
    }
  }
  function mapPoint(view, p) {
    return worldToScreen(view, p);
  }
  function drawPath(ctx, path, view) {
    if (path.segments.length === 0) return;
    ctx.beginPath();
    let p1 = mapPoint(view, path.segments[0].p1);
    ctx.moveTo(p1.x, p1.y);
    for (const seg of path.segments) {
      const start = mapPoint(view, seg.p1);
      if (Math.abs(start.x - p1.x) > 1e-6 || Math.abs(start.y - p1.y) > 1e-6) {
        ctx.moveTo(start.x, start.y);
      }
      switch (seg.kind) {
        case "line": {
          const p2 = mapPoint(view, seg.p2);
          ctx.lineTo(p2.x, p2.y);
          p1 = p2;
          break;
        }
        case "quad": {
          const c = mapPoint(view, seg.c);
          const p2 = mapPoint(view, seg.p2);
          ctx.quadraticCurveTo(c.x, c.y, p2.x, p2.y);
          p1 = p2;
          break;
        }
        case "cubic": {
          const c1 = mapPoint(view, seg.c1);
          const c2 = mapPoint(view, seg.c2);
          const p2 = mapPoint(view, seg.p2);
          ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
          p1 = p2;
          break;
        }
      }
    }
    if (path.closed) ctx.closePath();
  }
  function drawGrid(ctx, view, width, height, unit) {
    const baseMm = unit === "in" ? 25.4 : 1;
    const targetPx = 14;
    let step = baseMm;
    const mult = [1, 2, 5, 10];
    let guard = 0;
    while (step * view.zoom < targetPx && guard++ < 40) {
      const decade = Math.pow(10, Math.floor(Math.log10(step / baseMm)));
      const idx = mult.findIndex((m) => Math.abs(m * decade * baseMm - step) < 1e-9);
      const next = idx >= 0 && idx < mult.length - 1 ? mult[idx + 1] * decade * baseMm : step * 2;
      step = next;
    }
    while (step * view.zoom > targetPx * 12 && guard++ < 40) {
      step /= 2;
    }
    const majorEvery = unit === "in" ? 10 : 10;
    const worldLeft = (0 - view.panX) / view.zoom;
    const worldRight = (width - view.panX) / view.zoom;
    const worldBottom = (view.panY - height) / view.zoom;
    const worldTop = view.panY / view.zoom;
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.gridMinor;
    ctx.beginPath();
    const startX = Math.ceil(worldLeft / step) * step;
    for (let x = startX; x <= worldRight; x += step) {
      const sx = Math.round(view.panX + x * view.zoom) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }
    const startY = Math.ceil(worldBottom / step) * step;
    for (let y = startY; y <= worldTop; y += step) {
      const sy = Math.round(view.panY - y * view.zoom) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();
    const major = step * majorEvery;
    ctx.strokeStyle = COLORS.gridMajor;
    ctx.beginPath();
    const startXM = Math.ceil(worldLeft / major) * major;
    for (let x = startXM; x <= worldRight; x += major) {
      const sx = Math.round(view.panX + x * view.zoom) + 0.5;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }
    const startYM = Math.ceil(worldBottom / major) * major;
    for (let y = startYM; y <= worldTop; y += major) {
      const sy = Math.round(view.panY - y * view.zoom) + 0.5;
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();
    ctx.strokeStyle = COLORS.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const axisX = Math.round(view.panX) + 0.5;
    const axisY = Math.round(view.panY) + 0.5;
    if (axisX >= 0 && axisX <= width) {
      ctx.moveTo(axisX, 0);
      ctx.lineTo(axisX, height);
    }
    if (axisY >= 0 && axisY <= height) {
      ctx.moveTo(0, axisY);
      ctx.lineTo(width, axisY);
    }
    ctx.stroke();
    const worldPerUnit = unit === "in" ? 25.4 : 1;
    ctx.fillStyle = "#8b8b7d";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textBaseline = "top";
    const labelEvery = major * 2;
    const labelStartX = Math.ceil(worldLeft / labelEvery) * labelEvery;
    for (let x = labelStartX; x <= worldRight; x += labelEvery) {
      const sx = view.panX + x * view.zoom;
      if (sx < 24 || sx > width - 24) continue;
      ctx.fillText(fmtCoord(x / worldPerUnit), sx + 3, Math.min(Math.max(axisY + 3, 3), height - 16));
    }
    const labelStartY = Math.ceil(worldBottom / labelEvery) * labelEvery;
    for (let y = labelStartY; y <= worldTop; y += labelEvery) {
      const sy = view.panY - y * view.zoom;
      if (sy < 14 || sy > height - 14) continue;
      ctx.fillText(fmtCoord(y / worldPerUnit), Math.min(Math.max(axisX + 4, 4), width - 40), sy + 2);
    }
  }
  function fmtCoord(n) {
    const v = Math.abs(n) < 1e-9 ? 0 : n;
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  function drawLoop(ctx, loop, view) {
    if (loop.points.length === 0) return;
    ctx.beginPath();
    const first = mapPoint(view, loop.points[0]);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < loop.points.length; i++) {
      const p = mapPoint(view, loop.points[i]);
      ctx.lineTo(p.x, p.y);
    }
    if (loop.closed) ctx.closePath();
    ctx.stroke();
  }
  function drawDirectionArrows(ctx, loop, view, color, everyPx = 90) {
    const pts = loop.points;
    if (pts.length < 2) return;
    let travelled = 0;
    let nextArrow = 0;
    for (let i = 0; i < pts.length - (loop.closed ? 0 : 1); i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const segLen = dist(a, b) * view.zoom;
      if (travelled + segLen >= nextArrow && segLen > 1) {
        const t = segLen > 0 ? Math.min(1, (nextArrow - travelled) / segLen) : 0;
        const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        const dir = { x: b.x - a.x, y: b.y - a.y };
        const len = Math.hypot(dir.x, dir.y) || 1;
        const ux = dir.x / len;
        const uy = dir.y / len;
        const s = mapPoint(view, p);
        const size = 5;
        ctx.beginPath();
        ctx.moveTo(s.x + ux * size, s.y - uy * size);
        ctx.lineTo(s.x - uy * size * 0.6, s.y - ux * size * 0.6);
        ctx.lineTo(s.x + uy * size * 0.6, s.y + ux * size * 0.6);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        nextArrow += everyPx;
      }
      travelled += segLen;
    }
  }
  function drawTabMarks(ctx, loop, view) {
    if (!loop.tabs || loop.tabs.length === 0) return;
    const pts = loop.points;
    const n = pts.length;
    if (n < 2) return;
    const lengths = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      const l = dist(pts[i], pts[(i + 1) % n]);
      lengths.push(l);
      total += l;
    }
    for (const tab of loop.tabs) {
      const center = tab.start + tab.width / 2;
      let acc = 0;
      for (let i = 0; i < n; i++) {
        if (acc <= center && center <= acc + lengths[i]) {
          const t = lengths[i] > 0 ? (center - acc) / lengths[i] : 0;
          const a = pts[i];
          const b = pts[(i + 1) % n];
          const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
          const s = mapPoint(view, p);
          const dir = { x: b.x - a.x, y: b.y - a.y };
          const len = Math.hypot(dir.x, dir.y) || 1;
          const nx = -dir.y / len;
          const ny = dir.x / len;
          const size = 6;
          ctx.beginPath();
          ctx.moveTo(s.x - nx * size, s.y + ny * size);
          ctx.lineTo(s.x + nx * size, s.y - ny * size);
          ctx.strokeStyle = COLORS.tab;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          break;
        }
        acc += lengths[i];
      }
    }
  }
  function render(canvas, opts) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    if (opts.grid) drawGrid(ctx, opts.view, w, h, opts.unit);
    const referenced = /* @__PURE__ */ new Set();
    const selectedOp = opts.operations.find((o) => o.id === opts.selectedOperationId);
    if (selectedOp) {
      for (const id of selectedOp.pathIds) referenced.add(id);
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const path of opts.paths) {
      const isSelected = !!path.id && opts.selection.has(path.id);
      const isHover = path.id === opts.hoverPathId;
      const isReferenced = !!path.id && referenced.has(path.id);
      drawPath(ctx, path, opts.view);
      ctx.lineWidth = isSelected ? 2.4 : 1.6;
      ctx.strokeStyle = isSelected ? COLORS.pathSelected : isHover ? COLORS.pathHover : isReferenced ? COLORS.pathReferenced : COLORS.path;
      ctx.stroke();
      if (isSelected) {
        ctx.fillStyle = COLORS.pathSelected;
        for (const seg of path.segments) {
          const p = mapPoint(opts.view, seg.p1);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (opts.showToolpaths) {
      for (const op of opts.operations) {
        if (!op.visible || !op.processed) continue;
        const color = opColor(op.type);
        const isSel = op.id === opts.selectedOperationId;
        if (op.loops.length > 0) {
          for (const loop of op.loops) {
            if (opts.showToolDiameter && op.params.toolDiameter > 0) {
              drawLoop(ctx, loop, opts.view);
              ctx.lineWidth = Math.max(1, op.params.toolDiameter * opts.view.zoom);
              ctx.strokeStyle = color;
              ctx.globalAlpha = isSel ? 0.18 : 0.1;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
            drawLoop(ctx, loop, opts.view);
            ctx.lineWidth = isSel ? 2.6 : 1.8;
            ctx.strokeStyle = color;
            ctx.stroke();
            if (isSel) {
              drawDirectionArrows(ctx, loop, opts.view, color);
              drawTabMarks(ctx, loop, opts.view);
            }
            if (loop.points.length > 0) {
              const s = mapPoint(opts.view, loop.points[0]);
              ctx.beginPath();
              ctx.arc(s.x, s.y, isSel ? 4 : 3, 0, Math.PI * 2);
              ctx.fillStyle = isSel ? color : "#ffffff";
              ctx.fill();
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          }
        }
        if (op.drillPoints.length > 0) {
          for (const p of op.drillPoints) {
            const s = mapPoint(opts.view, p);
            const r = Math.max(2, op.params.toolDiameter / 2 * opts.view.zoom);
            ctx.beginPath();
            ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = isSel ? 0.35 : 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = isSel ? 2 : 1.4;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s.x - r * 0.5, s.y);
            ctx.lineTo(s.x + r * 0.5, s.y);
            ctx.moveTo(s.x, s.y - r * 0.5);
            ctx.lineTo(s.x, s.y + r * 0.5);
            ctx.stroke();
          }
        }
      }
    }
    if (opts.penPreview && opts.penPreview.length > 0) {
      ctx.beginPath();
      const first = mapPoint(opts.view, opts.penPreview[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < opts.penPreview.length; i++) {
        const p = mapPoint(opts.view, opts.penPreview[i]);
        ctx.lineTo(p.x, p.y);
      }
      if (opts.penCursor) {
        const p = mapPoint(opts.view, opts.penCursor);
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = "#0a84ff";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#0a84ff";
      for (const pt3 of opts.penPreview) {
        const p = mapPoint(opts.view, pt3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (opts.rubberBand) {
      const { x1, y1, x2, y2 } = opts.rubberBand;
      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const rw = Math.abs(x2 - x1);
      const rh = Math.abs(y2 - y1);
      ctx.fillStyle = "rgba(10,132,255,0.12)";
      ctx.strokeStyle = "rgba(10,132,255,0.8)";
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, rw, rh);
      ctx.strokeRect(x + 0.5, y + 0.5, rw, rh);
    }
  }
  function contentBounds(paths) {
    let b = null;
    for (const path of paths) {
      const pts = flattenPath(path, 0.05);
      if (pts.length === 0) continue;
      const pb = polygonBounds(pts);
      if (!b) b = pb;
      else {
        b.minX = Math.min(b.minX, pb.minX);
        b.minY = Math.min(b.minY, pb.minY);
        b.maxX = Math.max(b.maxX, pb.maxX);
        b.maxY = Math.max(b.maxY, pb.maxY);
      }
    }
    return b;
  }

  // src/ui.ts
  var activeOverlay = null;
  function openDialog(options) {
    return new Promise((resolve) => {
      if (activeOverlay) activeOverlay.remove();
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      const modal = document.createElement("div");
      modal.className = "modal" + (options.wide ? " modal-wide" : "");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      const header = document.createElement("div");
      header.className = "modal-header";
      const title = document.createElement("h2");
      title.textContent = options.title;
      header.appendChild(title);
      const closeBtn = document.createElement("button");
      closeBtn.className = "icon-button modal-close";
      closeBtn.type = "button";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.textContent = "\xD7";
      header.appendChild(closeBtn);
      modal.appendChild(header);
      if (options.description) {
        const desc = document.createElement("p");
        desc.className = "modal-description";
        desc.textContent = options.description;
        modal.appendChild(desc);
      }
      const form = document.createElement("form");
      form.className = "modal-form";
      form.noValidate = true;
      const grid = document.createElement("div");
      grid.className = "field-grid";
      form.appendChild(grid);
      const inputs = /* @__PURE__ */ new Map();
      const checkboxes = /* @__PURE__ */ new Map();
      for (const field of options.fields) {
        if (field.type === "label") {
          const el = document.createElement("div");
          el.className = "field-label-note";
          if (field.wide) el.classList.add("span-2");
          el.textContent = field.label || "";
          grid.appendChild(el);
          continue;
        }
        const wrap = document.createElement("label");
        wrap.className = "field";
        if (field.wide) wrap.classList.add("span-2");
        const labelText = document.createElement("span");
        labelText.className = "field-label";
        labelText.textContent = field.label || field.key;
        wrap.appendChild(labelText);
        let input;
        if (field.type === "select") {
          const sel = document.createElement("select");
          for (const opt of field.options || []) {
            const o = document.createElement("option");
            o.value = String(opt.value);
            o.textContent = opt.label;
            sel.appendChild(o);
          }
          if (field.value !== void 0) sel.value = String(field.value);
          if (field.disabled) sel.disabled = true;
          input = sel;
        } else if (field.type === "checkbox") {
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = !!field.value;
          cb.disabled = !!field.disabled;
          input = cb;
          checkboxes.set(field.key, cb);
          wrap.classList.add("field-checkbox");
        } else {
          const inp = document.createElement("input");
          inp.type = field.type === "number" ? "number" : field.type;
          if (field.value !== void 0) inp.value = String(field.value);
          if (field.min !== void 0) inp.min = String(field.min);
          if (field.max !== void 0) inp.max = String(field.max);
          if (field.step !== void 0) inp.step = String(field.step);
          if (field.placeholder) inp.placeholder = field.placeholder;
          if (field.disabled) inp.disabled = true;
          input = inp;
        }
        input.name = field.key;
        if (field.suffix) {
          const row = document.createElement("div");
          row.className = "input-row";
          row.appendChild(input);
          const suffix = document.createElement("span");
          suffix.className = "input-suffix";
          suffix.textContent = field.suffix;
          row.appendChild(suffix);
          wrap.appendChild(row);
        } else {
          wrap.appendChild(input);
        }
        if (field.help) {
          const help = document.createElement("span");
          help.className = "field-help";
          help.textContent = field.help;
          wrap.appendChild(help);
        }
        grid.appendChild(wrap);
        if (field.type !== "checkbox") inputs.set(field.key, input);
        else inputs.set(field.key, input);
      }
      const errorEl = document.createElement("div");
      errorEl.className = "modal-error";
      errorEl.hidden = true;
      form.appendChild(errorEl);
      const actions = document.createElement("div");
      actions.className = "modal-actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "button";
      cancel.textContent = options.cancelLabel || "Cancel";
      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "button primary";
      submit.textContent = options.submitLabel || "OK";
      actions.appendChild(cancel);
      actions.appendChild(submit);
      form.appendChild(actions);
      modal.appendChild(form);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      activeOverlay = overlay;
      const firstInput = Array.from(inputs.values()).find((i) => !i.disabled);
      setTimeout(() => firstInput?.focus(), 30);
      const close = (result) => {
        overlay.remove();
        if (activeOverlay === overlay) activeOverlay = null;
        document.removeEventListener("keydown", onKey);
        resolve(result);
      };
      const onKey = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close(null);
        }
      };
      document.addEventListener("keydown", onKey);
      closeBtn.addEventListener("click", () => close(null));
      cancel.addEventListener("click", () => close(null));
      overlay.addEventListener("pointerdown", (e) => {
        if (e.target === overlay) close(null);
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const values = {};
        for (const field of options.fields) {
          if (field.type === "label") continue;
          const input = inputs.get(field.key);
          if (field.type === "checkbox") values[field.key] = input.checked;
          else if (field.type === "number") {
            const raw = input.value.trim();
            values[field.key] = raw === "" ? NaN : Number(raw);
          } else if (field.type === "select") {
            const sel = input;
            const opt = (field.options || []).find((o) => String(o.value) === sel.value);
            values[field.key] = opt ? opt.value : sel.value;
          } else {
            values[field.key] = input.value;
          }
        }
        if (options.validate) {
          const err = options.validate(values);
          if (err) {
            errorEl.textContent = err;
            errorEl.hidden = false;
            return;
          }
        }
        close(values);
      });
    });
  }
  function showToast(message, kind = "info", timeout = 3800) {
    const container = document.getElementById("toasts");
    if (!container) return;
    while (container.children.length >= 4) container.firstElementChild?.remove();
    const toast = document.createElement("div");
    toast.className = `toast toast-${kind}`;
    toast.textContent = message;
    toast.addEventListener("click", () => toast.remove());
    container.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add("toast-out");
      window.setTimeout(() => toast.remove(), 300);
    }, timeout);
  }
  function confirmDialog(message, title = "Confirm") {
    return openDialog({
      title,
      description: message,
      fields: [],
      submitLabel: "Continue"
    }).then((v) => v !== null);
  }
  function showError(title, message) {
    void openDialog({
      title,
      description: message,
      fields: [],
      submitLabel: "Close"
    });
  }
  function initMenus(onCommand) {
    const menuButtons = Array.from(document.querySelectorAll("[data-menu]"));
    const dropdowns = /* @__PURE__ */ new Map();
    for (const btn of menuButtons) {
      const id = btn.dataset.menu;
      const dd = document.querySelector(`[data-dropdown="${id}"]`);
      if (dd) dropdowns.set(id, dd);
    }
    let openMenu = null;
    const closeAll = () => {
      openMenu = null;
      for (const btn of menuButtons) btn.classList.remove("open");
      for (const dd of dropdowns.values()) dd.classList.remove("open");
    };
    const open = (id) => {
      closeAll();
      openMenu = id;
      const btn = menuButtons.find((b) => b.dataset.menu === id);
      const dd = dropdowns.get(id);
      if (!btn || !dd) return;
      btn.classList.add("open");
      dd.classList.add("open");
      const r = btn.getBoundingClientRect();
      dd.style.position = "fixed";
      dd.style.top = `${Math.round(r.bottom + 4)}px`;
      const width = dd.offsetWidth || 250;
      const left = Math.min(r.left, window.innerWidth - width - 8);
      dd.style.left = `${Math.max(8, Math.round(left))}px`;
    };
    for (const btn of menuButtons) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.menu;
        if (openMenu === id) closeAll();
        else open(id);
      });
      btn.addEventListener("mouseenter", () => {
        if (openMenu && openMenu !== btn.dataset.menu) open(btn.dataset.menu);
      });
    }
    for (const dd of dropdowns.values()) {
      dd.addEventListener("click", (e) => {
        const item = e.target.closest("[data-command]");
        if (!item) return;
        e.stopPropagation();
        closeAll();
        onCommand(item.dataset.command);
      });
    }
    document.addEventListener("click", closeAll);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
  }
  function setActiveToolButton(tool) {
    for (const btn of Array.from(document.querySelectorAll("[data-tool]"))) {
      btn.classList.toggle("active", btn.dataset.tool === tool);
    }
  }

  // src/main.ts
  var APP_NAME = "MakerCam Modern";
  var PREFS_KEY = "makercam-modern-prefs-v1";
  var UNDO_LIMIT = 40;
  var TYPE_LABEL = {
    profile: "Profile",
    pocket: "Pocket",
    follow: "Follow path",
    drill: "Drill",
    drillpath: "Holes along path"
  };
  var TYPE_COLOR = {
    profile: "#12824c",
    pocket: "#c77c08",
    follow: "#7c3aed",
    drill: "#d62828",
    drillpath: "#be185d"
  };
  function cloneJSON(v) {
    return JSON.parse(JSON.stringify(v));
  }
  function convexHull(points) {
    if (points.length <= 3) return points.slice();
    const pts = points.slice().sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lower = [];
    for (const p of pts) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper = [];
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
  }
  function boundsUnion(a, b) {
    if (!a) return { ...b };
    return {
      minX: Math.min(a.minX, b.minX),
      minY: Math.min(a.minY, b.minY),
      maxX: Math.max(a.maxX, b.maxX),
      maxY: Math.max(a.maxY, b.maxY)
    };
  }
  var App = class {
    constructor() {
      __publicField(this, "canvas");
      __publicField(this, "ctx");
      __publicField(this, "fileInput");
      __publicField(this, "paths", []);
      __publicField(this, "operations", []);
      __publicField(this, "selection", /* @__PURE__ */ new Set());
      __publicField(this, "selectedOperationId", null);
      __publicField(this, "unit", "mm");
      __publicField(this, "pxPerInch", 96);
      __publicField(this, "tolerance", 0.02);
      __publicField(this, "view", { panX: 0, panY: 400, zoom: 4 });
      __publicField(this, "tool", "select");
      __publicField(this, "grid", true);
      __publicField(this, "snap", false);
      __publicField(this, "showToolpaths", true);
      __publicField(this, "showToolDiameter", false);
      __publicField(this, "hoverPathId", null);
      __publicField(this, "drag", null);
      __publicField(this, "pendingSnapshot", null);
      __publicField(this, "rubberBand", null);
      __publicField(this, "penPoints", []);
      __publicField(this, "penCursor", null);
      __publicField(this, "spaceDown", false);
      __publicField(this, "lastPointerScreen", { x: 0, y: 0 });
      __publicField(this, "lastWorld", { x: 0, y: 0 });
      __publicField(this, "undoStack", []);
      __publicField(this, "redoStack", []);
      __publicField(this, "clipboard", []);
      __publicField(this, "flattenCache", /* @__PURE__ */ new WeakMap());
      __publicField(this, "nextPathId", 1);
      __publicField(this, "nextOperationId", 1);
      __publicField(this, "nestBoundaryId", null);
      __publicField(this, "renderQueued", false);
      __publicField(this, "initialized", false);
      const canvas = document.getElementById("canvas");
      if (!canvas) throw new Error("Canvas element not found");
      this.canvas = canvas;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("2D canvas context unavailable");
      this.ctx = ctx;
      this.fileInput = document.getElementById("file-input");
      this.loadPrefs();
      this.bindUI();
      this.bindCanvas();
      this.bindKeyboard();
      this.bindFileInput();
      this.updateToolButtons();
      this.renderOperations();
      this.updateEmptyState();
      this.updateStatus();
      this.initialized = true;
      window.makercam = this;
      const exampleParam = new URLSearchParams(window.location.search).get("example");
      const openExample = exampleParam === "1" || exampleParam === "";
      requestAnimationFrame(() => {
        this.fit();
        this.requestRender();
        if (openExample) this.loadExample();
      });
    }
    /* ------------------------------------------------------------------ */
    /* Persistence of preferences                                          */
    /* ------------------------------------------------------------------ */
    loadPrefs() {
      try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (!raw) return;
        const p = JSON.parse(raw);
        if (p.unit === "mm" || p.unit === "in") this.unit = p.unit;
        if (typeof p.pxPerInch === "number") this.pxPerInch = p.pxPerInch;
        if (typeof p.tolerance === "number") this.tolerance = p.tolerance;
        if (typeof p.grid === "boolean") this.grid = p.grid;
        if (typeof p.snap === "boolean") this.snap = p.snap;
        if (typeof p.showToolpaths === "boolean") this.showToolpaths = p.showToolpaths;
        if (typeof p.showToolDiameter === "boolean") this.showToolDiameter = p.showToolDiameter;
      } catch {
      }
    }
    savePrefs() {
      try {
        const p = {
          unit: this.unit,
          pxPerInch: this.pxPerInch,
          tolerance: this.tolerance,
          grid: this.grid,
          snap: this.snap,
          showToolpaths: this.showToolpaths,
          showToolDiameter: this.showToolDiameter
        };
        localStorage.setItem(PREFS_KEY, JSON.stringify(p));
      } catch {
      }
    }
    /* ------------------------------------------------------------------ */
    /* Unit helpers                                                        */
    /* ------------------------------------------------------------------ */
    toDisplay(mm) {
      return this.unit === "in" ? mm / 25.4 : mm;
    }
    fromDisplay(value) {
      return this.unit === "in" ? value * 25.4 : value;
    }
    unitLabel() {
      return this.unit;
    }
    fmtLen(mm, digits = 2) {
      return this.toDisplay(mm).toFixed(digits);
    }
    /* ------------------------------------------------------------------ */
    /* UI wiring                                                           */
    /* ------------------------------------------------------------------ */
    bindUI() {
      initMenus((cmd) => {
        void this.handleCommand(cmd);
      });
      for (const btn of Array.from(document.querySelectorAll("[data-tool]"))) {
        btn.addEventListener("click", () => this.setTool(btn.dataset.tool));
      }
      const bind = (id, fn) => {
        document.getElementById(id)?.addEventListener("click", fn);
      };
      bind("btn-fit", () => this.fit());
      bind("btn-zoom-in", () => this.zoomAtCenter(1.2));
      bind("btn-zoom-out", () => this.zoomAtCenter(1 / 1.2));
      bind("btn-grid", () => this.toggleGrid());
      bind("btn-snap", () => this.toggleSnap());
      bind("btn-show-toolpaths", () => this.toggleToolpaths());
      bind("btn-show-diameter", () => this.toggleToolDiameter());
      bind("btn-add-op", () => this.addOperationDialog());
      bind("btn-export", () => this.exportGcodeDialog());
      bind("btn-empty-import", () => this.fileInput.click());
      bind("btn-empty-shape", () => this.insertShapeDialog());
      bind("btn-empty-example", () => this.loadExample());
      bind("btn-sidebar", () => {
        document.querySelector(".sidebar")?.classList.toggle("open");
      });
      const unitSelect = document.getElementById("unit-select");
      if (unitSelect) {
        unitSelect.value = this.unit;
        unitSelect.addEventListener("change", () => {
          this.unit = unitSelect.value;
          this.savePrefs();
          this.updateStatus();
          this.renderOperations();
          this.requestRender();
          showToast(`Display units: ${this.unit === "mm" ? "millimetres" : "inches"}`, "info", 2500);
        });
      }
      window.addEventListener("resize", () => this.requestRender());
      window.addEventListener("beforeunload", () => this.savePrefs());
    }
    bindCanvas() {
      this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
      this.canvas.addEventListener("pointermove", (e) => this.onPointerMove(e));
      this.canvas.addEventListener("pointerup", (e) => this.onPointerUp(e));
      this.canvas.addEventListener("pointercancel", (e) => this.onPointerUp(e));
      this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
      this.canvas.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          const p = this.canvasPoint(e);
          const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
          this.zoomAt(p, factor);
        },
        { passive: false }
      );
      this.canvas.addEventListener("dblclick", (e) => {
        if (this.tool === "pen") {
          e.preventDefault();
          this.finishPen(false);
        }
      });
      const wrap = document.getElementById("canvas-wrap");
      wrap.addEventListener("dragover", (e) => {
        e.preventDefault();
        wrap.classList.add("drag-over");
      });
      wrap.addEventListener("dragleave", () => wrap.classList.remove("drag-over"));
      wrap.addEventListener("drop", (e) => {
        e.preventDefault();
        wrap.classList.remove("drag-over");
        const file = e.dataTransfer?.files?.[0];
        if (file) void this.readFile(file);
      });
    }
    bindFileInput() {
      this.fileInput.addEventListener("change", () => {
        const file = this.fileInput.files?.[0];
        if (file) void this.readFile(file);
        this.fileInput.value = "";
      });
    }
    bindKeyboard() {
      window.addEventListener("keydown", (e) => {
        const target = e.target;
        const typing = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
        const modal = !!document.querySelector(".modal-overlay");
        if (typing || modal) {
          if (e.key === "Escape" && !modal) {
            target?.blur();
          }
          return;
        }
        if (e.key === " ") {
          if (!this.spaceDown) {
            this.spaceDown = true;
            this.canvas.classList.add("cursor-grab");
          }
          e.preventDefault();
          return;
        }
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          this.undo();
          return;
        }
        if (ctrl && (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "z" && e.shiftKey)) {
          e.preventDefault();
          this.redo();
          return;
        }
        if (ctrl && e.key.toLowerCase() === "a") {
          e.preventDefault();
          this.selectAll();
          return;
        }
        if (ctrl && e.key.toLowerCase() === "c") {
          e.preventDefault();
          this.copySelection();
          return;
        }
        if (ctrl && e.key.toLowerCase() === "v") {
          e.preventDefault();
          this.pasteSelection();
          return;
        }
        if (ctrl && e.key.toLowerCase() === "s") {
          e.preventDefault();
          this.saveProject();
          return;
        }
        if (ctrl && e.key.toLowerCase() === "e") {
          e.preventDefault();
          this.exportGcodeDialog();
          return;
        }
        if (ctrl && e.key.toLowerCase() === "o") {
          e.preventDefault();
          this.fileInput.click();
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          this.deleteSelection();
          return;
        }
        if (e.key === "Escape") {
          if (this.penPoints.length > 0) {
            this.cancelPen();
          } else if (this.drag) {
            this.endDrag();
          }
          return;
        }
        if (e.key === "Enter" && this.tool === "pen") {
          e.preventDefault();
          this.finishPen(false);
          return;
        }
        if (!ctrl) {
          switch (e.key.toLowerCase()) {
            case "v":
              this.setTool("select");
              break;
            case "h":
              this.setTool("pan");
              break;
            case "p":
              this.setTool("pen");
              break;
            case "f":
              this.fit();
              break;
            case "g":
              this.toggleGrid();
              break;
            case "+":
            case "=":
              this.zoomAtCenter(1.2);
              break;
            case "-":
            case "_":
              this.zoomAtCenter(1 / 1.2);
              break;
          }
        }
      });
      window.addEventListener("keyup", (e) => {
        if (e.key === " ") {
          this.spaceDown = false;
          this.canvas.classList.remove("cursor-grab");
          this.updateCursor();
        }
      });
    }
    /* ------------------------------------------------------------------ */
    /* Pointer interaction                                                 */
    /* ------------------------------------------------------------------ */
    canvasPoint(e) {
      const r = this.canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    worldPoint(e) {
      const w = screenToWorld(this.view, this.canvasPoint(e));
      return this.snap ? this.applySnap(w) : w;
    }
    applySnap(p) {
      const step = this.unit === "in" ? 2.54 : 1;
      return { x: Math.round(p.x / step) * step, y: Math.round(p.y / step) * step };
    }
    flatPath(path) {
      let pts = this.flattenCache.get(path);
      if (!pts) {
        pts = flattenPath(path, 0.2);
        this.flattenCache.set(path, pts);
      }
      return pts;
    }
    hitPath(world) {
      const tol = 7 / this.view.zoom;
      let best = null;
      let bestD = tol;
      for (const path of this.paths) {
        const pts = this.flatPath(path);
        const d = distanceToPolyline(world, pts, isClosedPath(path));
        if (d < bestD) {
          bestD = d;
          best = path;
        }
      }
      return best;
    }
    hitOperation(world) {
      const tol = 7 / this.view.zoom;
      let best = null;
      let bestD = tol;
      for (const op of this.operations) {
        if (!op.visible || !op.processed) continue;
        for (const loop of op.loops) {
          const d = distanceToPolyline(world, loop.points, loop.closed);
          if (d < bestD) {
            bestD = d;
            best = op;
          }
        }
        for (const p of op.drillPoints) {
          const d = dist(world, p);
          if (d < bestD) {
            bestD = d;
            best = op;
          }
        }
      }
      return best;
    }
    onPointerDown(e) {
      if (window.innerWidth <= 820) {
        document.querySelector(".sidebar")?.classList.remove("open");
      }
      this.canvas.setPointerCapture(e.pointerId);
      const screen = this.canvasPoint(e);
      this.lastPointerScreen = screen;
      const world = this.worldPoint(e);
      this.lastWorld = world;
      this.updateStatusCoords(world);
      if (e.button === 1 || e.button === 2 || this.spaceDown || this.tool === "pan") {
        e.preventDefault();
        this.drag = {
          kind: "pan",
          startScreen: screen,
          startPan: { x: this.view.panX, y: this.view.panY }
        };
        this.canvas.classList.add("cursor-grabbing");
        return;
      }
      if (e.button !== 0) return;
      if (this.tool === "pen") {
        this.penPointerDown(world);
        return;
      }
      if (this.tool === "select") {
        const path = this.hitPath(world);
        if (path && path.id) {
          const additive = e.shiftKey;
          if (additive) {
            if (this.selection.has(path.id)) this.selection.delete(path.id);
            else this.selection.add(path.id);
            this.selectedOperationId = null;
            this.updateSelectionUI();
            this.requestRender();
            return;
          }
          if (!this.selection.has(path.id)) {
            this.selection.clear();
            this.selection.add(path.id);
          }
          this.selectedOperationId = null;
          this.updateSelectionUI();
          this.pendingSnapshot = this.snapshot();
          const originals = this.paths.filter((p) => p.id && this.selection.has(p.id)).map((p) => clonePath(p));
          this.drag = {
            kind: "move",
            startWorld: world,
            originals,
            ids: originals.map((p) => p.id).filter(Boolean),
            moved: false
          };
          this.canvas.classList.add("cursor-move");
          this.requestRender();
          return;
        }
        const op = this.hitOperation(world);
        if (op) {
          this.selectedOperationId = op.id;
          this.updateSelectionUI();
          this.renderOperations();
          this.requestRender();
          return;
        }
        if (!e.shiftKey) {
          this.selection.clear();
          this.selectedOperationId = null;
          this.updateSelectionUI();
        }
        this.drag = { kind: "band", startScreen: screen, additive: e.shiftKey };
        this.rubberBand = { x1: screen.x, y1: screen.y, x2: screen.x, y2: screen.y };
        this.requestRender();
      }
    }
    onPointerMove(e) {
      const screen = this.canvasPoint(e);
      const world = this.worldPoint(e);
      this.lastPointerScreen = screen;
      this.lastWorld = world;
      this.updateStatusCoords(world);
      if (!this.drag) {
        if (this.tool === "pen") {
          this.penCursor = world;
          this.requestRender();
          return;
        }
        if (this.tool === "select") {
          const path = this.hitPath(world);
          const op = path ? null : this.hitOperation(world);
          const newHover = path?.id ?? null;
          if (newHover !== this.hoverPathId) {
            this.hoverPathId = newHover;
            this.requestRender();
          }
          this.updateCursor();
          if (op) this.canvas.classList.add("cursor-move");
        }
        return;
      }
      if (this.drag.kind === "pan") {
        this.view.panX = this.drag.startPan.x + (screen.x - this.drag.startScreen.x);
        this.view.panY = this.drag.startPan.y + (screen.y - this.drag.startScreen.y);
        this.requestRender();
        return;
      }
      if (this.drag.kind === "band") {
        this.rubberBand = {
          x1: this.drag.startScreen.x,
          y1: this.drag.startScreen.y,
          x2: screen.x,
          y2: screen.y
        };
        this.requestRender();
        return;
      }
      if (this.drag.kind === "move") {
        const dx = world.x - this.drag.startWorld.x;
        const dy = world.y - this.drag.startWorld.y;
        if (!this.drag.moved && Math.hypot(dx, dy) * this.view.zoom > 2) {
          this.drag.moved = true;
        }
        if (!this.drag.moved) return;
        const byId = new Map(this.drag.originals.map((p) => [p.id, p]));
        for (const id of this.drag.ids) {
          const original = byId.get(id);
          if (!original) continue;
          const index = this.paths.findIndex((p) => p.id === id);
          if (index < 0) continue;
          this.paths[index] = transformPath(original, matrixTranslate(dx, dy));
        }
        this.requestRender();
        this.updateStatus();
      }
    }
    onPointerUp(e) {
      if (this.canvas.hasPointerCapture(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
      if (!this.drag) return;
      if (this.drag.kind === "band") {
        this.finishBand();
        return;
      }
      if (this.drag.kind === "move") {
        const moved = this.drag.moved;
        const snapshot = this.pendingSnapshot;
        this.endDrag();
        if (moved) {
          if (snapshot) this.pushUndoSnapshot(snapshot);
          this.regenerateAll(true);
        }
        return;
      }
      this.endDrag();
    }
    endDrag() {
      this.drag = null;
      this.rubberBand = null;
      this.pendingSnapshot = null;
      this.canvas.classList.remove("cursor-grabbing", "cursor-move");
      this.updateCursor();
      this.requestRender();
    }
    finishBand() {
      if (!this.rubberBand) {
        this.endDrag();
        return;
      }
      const a = screenToWorld(this.view, { x: this.rubberBand.x1, y: this.rubberBand.y1 });
      const b = screenToWorld(this.view, { x: this.rubberBand.x2, y: this.rubberBand.y2 });
      const rect = {
        minX: Math.min(a.x, b.x),
        maxX: Math.max(a.x, b.x),
        minY: Math.min(a.y, b.y),
        maxY: Math.max(a.y, b.y)
      };
      const additive = this.drag?.kind === "band" ? this.drag.additive : false;
      if (!additive) this.selection.clear();
      if (rect.maxX - rect.minX > 1e-6 || rect.maxY - rect.minY > 1e-6) {
        for (const path of this.paths) {
          if (!path.id) continue;
          const pts = this.flatPath(path);
          const bb = polygonBounds(pts);
          const intersects = bb.maxX >= rect.minX && bb.minX <= rect.maxX && bb.maxY >= rect.minY && bb.minY <= rect.maxY;
          if (intersects) this.selection.add(path.id);
        }
      }
      this.selectedOperationId = null;
      this.endDrag();
      this.updateSelectionUI();
      this.requestRender();
    }
    updateCursor() {
      this.canvas.classList.remove("cursor-move", "cursor-grab", "cursor-grabbing", "cursor-crosshair");
      if (this.spaceDown || this.tool === "pan") {
        this.canvas.classList.add("cursor-grab");
      } else if (this.tool === "pen") {
        this.canvas.classList.add("cursor-crosshair");
      } else if (this.hoverPathId) {
        this.canvas.classList.add("cursor-move");
      }
    }
    /* ------------------------------------------------------------------ */
    /* Pen tool                                                            */
    /* ------------------------------------------------------------------ */
    penPointerDown(world) {
      if (this.penPoints.length >= 3) {
        const first = this.penPoints[0];
        if (dist(world, first) * this.view.zoom < 10) {
          this.finishPen(true);
          return;
        }
      }
      const last = this.penPoints[this.penPoints.length - 1];
      if (last && dist(last, world) < 1e-6) return;
      this.penPoints.push(world);
      this.penCursor = world;
      this.updateHint("Click to add points. Click the first point to close, Enter to finish, Esc to cancel.");
      this.requestRender();
    }
    finishPen(closed) {
      if (this.penPoints.length < 2) {
        this.cancelPen();
        return;
      }
      const points = this.penPoints.slice();
      const segments = [];
      for (let i = 1; i < points.length; i++) {
        segments.push({ kind: "line", p1: points[i - 1], p2: points[i] });
      }
      if (closed) segments.push({ kind: "line", p1: points[points.length - 1], p2: points[0] });
      this.pushUndo();
      const path = { segments, closed, id: this.newPathId(), name: "Pen path" };
      this.paths.push(path);
      this.selection.clear();
      this.selection.add(path.id);
      this.selectedOperationId = null;
      this.penPoints = [];
      this.penCursor = null;
      this.updateSelectionUI();
      this.updateEmptyState();
      this.updateHint("Path added.");
      this.requestRender();
    }
    cancelPen() {
      this.penPoints = [];
      this.penCursor = null;
      this.updateHint("Pen cancelled.");
      this.requestRender();
    }
    /* ------------------------------------------------------------------ */
    /* Navigation                                                          */
    /* ------------------------------------------------------------------ */
    zoomAt(screen, factor) {
      const before = screenToWorld(this.view, screen);
      const minZoom = 0.05;
      const maxZoom = 400;
      const zoom = Math.min(maxZoom, Math.max(minZoom, this.view.zoom * factor));
      if (Math.abs(zoom - this.view.zoom) < 1e-9) return;
      this.view.zoom = zoom;
      this.view.panX = screen.x - before.x * zoom;
      this.view.panY = screen.y + before.y * zoom;
      this.updateStatus();
      this.requestRender();
    }
    zoomAtCenter(factor) {
      const rect = this.canvas.getBoundingClientRect();
      this.zoomAt({ x: rect.width / 2, y: rect.height / 2 }, factor);
    }
    fit() {
      const rect = this.canvas.getBoundingClientRect();
      const b = contentBounds(this.paths);
      if (!b) {
        this.view = { panX: rect.width / 2, panY: rect.height / 2, zoom: 4 };
      } else {
        this.view = fitView(b, rect.width, rect.height, 64);
        this.view.zoom = Math.min(400, Math.max(0.05, this.view.zoom));
      }
      this.updateStatus();
      this.requestRender();
    }
    fitToSelection() {
      const selected = this.paths.filter((p) => p.id && this.selection.has(p.id));
      if (selected.length === 0) {
        this.fit();
        return;
      }
      const b = contentBounds(selected);
      if (!b) {
        this.fit();
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      this.view = fitView(b, rect.width, rect.height, 64);
      this.requestRender();
    }
    /* ------------------------------------------------------------------ */
    /* Rendering                                                           */
    /* ------------------------------------------------------------------ */
    requestRender() {
      if (this.renderQueued) return;
      this.renderQueued = true;
      requestAnimationFrame(() => {
        this.renderQueued = false;
        this.renderNow();
      });
    }
    renderNow() {
      render(this.canvas, {
        paths: this.paths,
        operations: this.operations,
        selection: this.selection,
        selectedOperationId: this.selectedOperationId,
        view: this.view,
        unit: this.unit,
        grid: this.grid,
        showToolpaths: this.showToolpaths,
        showToolDiameter: this.showToolDiameter,
        hoverPathId: this.hoverPathId,
        rubberBand: this.rubberBand,
        penPreview: this.penPoints.length > 0 ? this.penPoints : null,
        penCursor: this.penCursor,
        tool: this.tool
      });
      this.updateEmptyState();
    }
    updateEmptyState() {
      const el = document.getElementById("empty-state");
      if (!el) return;
      el.classList.toggle("hidden", this.paths.length > 0);
    }
    updateStatus() {
      const zoomPercent = Math.round(this.view.zoom / (96 / 25.4) * 100);
      const zoomEl = document.getElementById("status-zoom");
      if (zoomEl) zoomEl.textContent = `${zoomPercent}%`;
      const selEl = document.getElementById("status-selection");
      if (selEl) {
        const n = this.selection.size;
        selEl.textContent = `${n} path${n === 1 ? "" : "s"} selected`;
      }
      this.updateStatusCoords(this.lastWorld);
    }
    updateStatusCoords(world) {
      const el = document.getElementById("status-coords");
      if (!el) return;
      const d = this.unit === "in" ? 3 : 2;
      el.textContent = `X ${this.toDisplay(world.x).toFixed(d)} Y ${this.toDisplay(world.y).toFixed(d)} ${this.unit}`;
    }
    updateHint(text) {
      const el = document.getElementById("status-hint");
      if (el) el.textContent = text;
    }
    updateSelectionUI() {
      this.updateStatus();
      this.renderOperations();
      this.requestRender();
    }
    /* ------------------------------------------------------------------ */
    /* Tools and toggles                                                   */
    /* ------------------------------------------------------------------ */
    setTool(tool) {
      if (this.tool === "pen" && tool !== "pen") this.cancelPen();
      this.tool = tool;
      this.updateToolButtons();
      this.updateCursor();
      if (tool === "select") this.updateHint("Select paths. Shift-click to add; drag to move; drag empty space to marquee.");
      else if (tool === "pan") this.updateHint("Drag to pan. Wheel to zoom.");
      else this.updateHint("Click to draw. Click the first point to close, Enter to finish, Esc to cancel.");
      this.requestRender();
    }
    updateToolButtons() {
      setActiveToolButton(this.tool);
    }
    toggleGrid() {
      this.grid = !this.grid;
      const btn = document.getElementById("btn-grid");
      btn?.classList.toggle("active", this.grid);
      btn?.setAttribute("aria-pressed", String(this.grid));
      this.savePrefs();
      this.requestRender();
    }
    toggleSnap() {
      this.snap = !this.snap;
      const btn = document.getElementById("btn-snap");
      btn?.classList.toggle("active", this.snap);
      btn?.setAttribute("aria-pressed", String(this.snap));
      this.savePrefs();
      showToast(this.snap ? "Snap to grid enabled" : "Snap to grid disabled", "info", 2e3);
    }
    toggleToolpaths() {
      this.showToolpaths = !this.showToolpaths;
      const btn = document.getElementById("btn-show-toolpaths");
      btn?.classList.toggle("active", this.showToolpaths);
      btn?.setAttribute("aria-pressed", String(this.showToolpaths));
      this.savePrefs();
      this.requestRender();
    }
    toggleToolDiameter() {
      this.showToolDiameter = !this.showToolDiameter;
      const btn = document.getElementById("btn-show-diameter");
      btn?.classList.toggle("active", this.showToolDiameter);
      btn?.setAttribute("aria-pressed", String(this.showToolDiameter));
      this.savePrefs();
      this.requestRender();
    }
    /* ------------------------------------------------------------------ */
    /* Undo / redo                                                         */
    /* ------------------------------------------------------------------ */
    snapshot() {
      return {
        paths: cloneJSON(this.paths),
        operations: cloneJSON(this.operations),
        selection: Array.from(this.selection),
        selectedOperationId: this.selectedOperationId
      };
    }
    pushUndo() {
      this.pushUndoSnapshot(this.snapshot());
    }
    pushUndoSnapshot(s) {
      this.undoStack.push(s);
      if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
      this.redoStack = [];
    }
    restore(s) {
      this.paths = cloneJSON(s.paths);
      this.operations = cloneJSON(s.operations);
      this.selection = new Set(s.selection);
      this.selectedOperationId = s.selectedOperationId;
      this.hoverPathId = null;
      this.rubberBand = null;
      this.updateSelectionUI();
      this.updateEmptyState();
      this.requestRender();
    }
    undo() {
      const s = this.undoStack.pop();
      if (!s) {
        showToast("Nothing to undo", "info", 1800);
        return;
      }
      this.redoStack.push(this.snapshot());
      this.restore(s);
      showToast("Undo", "info", 1200);
    }
    redo() {
      const s = this.redoStack.pop();
      if (!s) {
        showToast("Nothing to redo", "info", 1800);
        return;
      }
      this.undoStack.push(this.snapshot());
      this.restore(s);
      showToast("Redo", "info", 1200);
    }
    /* ------------------------------------------------------------------ */
    /* Selection helpers                                                   */
    /* ------------------------------------------------------------------ */
    selectAll() {
      this.selection = new Set(this.paths.map((p) => p.id).filter(Boolean));
      this.selectedOperationId = null;
      this.updateSelectionUI();
    }
    copySelection() {
      const selected = this.paths.filter((p) => p.id && this.selection.has(p.id));
      if (selected.length === 0) {
        showToast("Select one or more paths to copy", "info", 2200);
        return;
      }
      this.clipboard = selected.map(clonePath);
      showToast(`Copied ${selected.length} path${selected.length === 1 ? "" : "s"}`, "success", 1800);
    }
    pasteSelection() {
      if (this.clipboard.length === 0) {
        showToast("Clipboard is empty", "info", 1800);
        return;
      }
      this.pushUndo();
      const offset = matrixTranslate(10, -10);
      this.selection.clear();
      for (const p of this.clipboard) {
        const copy = transformPath(clonePath(p), offset);
        copy.id = this.newPathId();
        copy.name = p.name ? `${p.name} copy` : "Copy";
        this.paths.push(copy);
        this.selection.add(copy.id);
      }
      this.selectedOperationId = null;
      this.updateSelectionUI();
      this.updateEmptyState();
      showToast(`Pasted ${this.clipboard.length} path${this.clipboard.length === 1 ? "" : "s"}`, "success", 1800);
    }
    deleteSelection() {
      if (this.selection.size === 0) return;
      this.pushUndo();
      const ids = new Set(this.selection);
      this.paths = this.paths.filter((p) => !p.id || !ids.has(p.id));
      const removedOps = [];
      this.operations = this.operations.filter((op) => {
        op.pathIds = op.pathIds.filter((id) => !ids.has(id));
        if (op.pathIds.length === 0) {
          removedOps.push(op.id);
          return false;
        }
        return true;
      });
      if (this.selectedOperationId && removedOps.includes(this.selectedOperationId)) {
        this.selectedOperationId = null;
      }
      this.selection.clear();
      this.regenerateAll(true);
      this.updateSelectionUI();
      this.updateEmptyState();
      this.requestRender();
    }
    /* ------------------------------------------------------------------ */
    /* IDs and path helpers                                                */
    /* ------------------------------------------------------------------ */
    newPathId() {
      let id = `p${this.nextPathId++}`;
      while (this.paths.some((p) => p.id === id)) id = `p${this.nextPathId++}`;
      return id;
    }
    newOperationId() {
      let id = `op${this.nextOperationId++}`;
      while (this.operations.some((o) => o.id === id)) id = `op${this.nextOperationId++}`;
      return id;
    }
    ensurePathIds(paths) {
      for (const p of paths) {
        if (!p.id) p.id = this.newPathId();
        else {
          const n = /^p(\d+)$/.exec(p.id);
          if (n) this.nextPathId = Math.max(this.nextPathId, Number(n[1]) + 1);
        }
      }
      const seen = /* @__PURE__ */ new Set();
      for (const p of paths) {
        if (!p.id || seen.has(p.id)) p.id = this.newPathId();
        seen.add(p.id);
      }
    }
    selectedPaths() {
      return this.paths.filter((p) => p.id && this.selection.has(p.id));
    }
    pathsForOperation(op) {
      const ids = new Set(op.pathIds);
      return this.paths.filter((p) => p.id && ids.has(p.id));
    }
    /* ------------------------------------------------------------------ */
    /* Operations                                                          */
    /* ------------------------------------------------------------------ */
    regenerateOperation(op) {
      const paths = this.pathsForOperation(op);
      if (paths.length === 0) {
        op.loops = [];
        op.drillPoints = [];
        op.processed = false;
        return ["The operation has no drawing paths left."];
      }
      const result = generateToolpath(op.type, op.params, paths, this.tolerance);
      op.loops = result.loops;
      op.drillPoints = result.drillPoints;
      op.processed = result.loops.length > 0 || result.drillPoints.length > 0;
      return result.warnings;
    }
    regenerateAll(silent = false) {
      const warnings = [];
      for (const op of this.operations) {
        for (const w of this.regenerateOperation(op)) warnings.push(`${op.name}: ${w}`);
      }
      this.renderOperations();
      this.requestRender();
      if (!silent && warnings.length > 0) {
        showToast(warnings.slice(0, 3).join(" "), "warning", 7e3);
      }
    }
    addOperationDialog() {
      if (this.paths.length === 0) {
        showToast("Import a drawing first", "info", 2200);
        return;
      }
      void openDialog({
        title: "Add toolpath",
        description: "Choose the type of CAM operation to create for the selected paths.",
        fields: [
          {
            key: "type",
            label: "Operation",
            type: "select",
            value: "profile",
            options: [
              { label: "Profile (outside / inside)", value: "profile" },
              { label: "Pocket (clear the interior)", value: "pocket" },
              { label: "Follow path (cut on the line)", value: "follow" },
              { label: "Drill (holes / centers)", value: "drill" },
              { label: "Holes along a path", value: "drillpath" }
            ]
          },
          {
            key: "note",
            type: "label",
            wide: true,
            label: "Profile and pocket need closed paths. Follow path and holes along a path work with open or closed paths."
          }
        ],
        submitLabel: "Continue"
      }).then((v) => {
        if (v) void this.createOperation(v.type);
      });
    }
    async createOperation(type) {
      const selected = this.selectedPaths();
      if (selected.length === 0) {
        showToast("Select one or more paths first", "warning", 2600);
        return;
      }
      let paths = selected;
      if (type === "profile" || type === "pocket" || type === "drill") {
        paths = selected.filter((p) => isClosedPath(p));
        if (paths.length === 0) {
          showToast("This operation needs at least one closed path", "warning", 3200);
          return;
        }
        if (paths.length < selected.length) {
          showToast("Open paths were ignored for this operation", "info", 3e3);
        }
      }
      if (type === "drill" && paths.length === 0) {
        showToast("Select at least one closed path to drill", "warning", 2600);
        return;
      }
      const fields = this.operationFields(type);
      const values = await openDialog({
        title: `${TYPE_LABEL[type]} operation`,
        description: this.operationDescription(type),
        fields,
        submitLabel: "Create toolpath",
        wide: true,
        validate: (v) => this.validateOperation(type, v)
      });
      if (!values) return;
      const params = this.paramsFromValues(type, values);
      const name = String(values.name || `${type} ${this.operations.length + 1}`).trim() || `${type} ${this.operations.length + 1}`;
      const op = {
        id: this.newOperationId(),
        type,
        name,
        params,
        pathIds: paths.map((p) => p.id).filter(Boolean),
        loops: [],
        drillPoints: [],
        processed: false,
        visible: true
      };
      this.pushUndo();
      const warnings = this.regenerateOperation(op);
      this.operations.push(op);
      this.selectedOperationId = op.id;
      this.updateSelectionUI();
      this.updateEmptyState();
      if (!op.processed) {
        showToast(warnings[0] || "No toolpath could be generated. Try different parameters.", "error", 6e3);
      } else {
        showToast(`${TYPE_LABEL[type]} created${warnings.length ? " with warnings" : ""}`, warnings.length ? "warning" : "success", 3200);
      }
      this.requestRender();
    }
    operationDescription(type) {
      switch (type) {
        case "profile":
          return "Cut around the selected closed paths, offset by the cutter radius.";
        case "pocket":
          return "Clear the interior with concentric offsets. Step-over is a percentage of the cutter diameter.";
        case "follow":
          return "Run the cutter directly along the selected paths (no offset).";
        case "drill":
          return "Peck-drill at the centre of each closed path, or fill the shape with a hole pattern.";
        case "drillpath":
          return "Place a fixed number of holes evenly along each selected path and peck-drill them to the target depth.";
      }
    }
    operationFields(type, op) {
      const p = op?.params ?? DEFAULT_PARAMS(this.unit);
      const u = this.unitLabel();
      const len = (mm) => Number(this.toDisplay(mm).toFixed(4));
      const fields = [
        { key: "name", label: "Name", type: "text", value: op?.name ?? `${type} ${this.operations.length + 1}` },
        {
          key: "toolDiameter",
          label: "Tool diameter",
          type: "number",
          value: len(p.toolDiameter),
          min: 1e-3,
          step: 0.1,
          suffix: u
        },
        {
          key: "targetDepth",
          label: "Target depth",
          type: "number",
          value: len(p.targetDepth),
          step: 0.1,
          suffix: u,
          help: "Usually negative (below the stock surface)."
        }
      ];
      if (type === "profile") {
        fields.push(
          {
            key: "outside",
            label: "Offset side",
            type: "select",
            value: p.outside,
            options: [
              { label: "Outside", value: true },
              { label: "Inside", value: false }
            ]
          },
          { key: "safetyHeight", label: "Safety height", type: "number", value: len(p.safetyHeight), step: 0.1, suffix: u },
          { key: "stockSurface", label: "Stock surface", type: "number", value: len(p.stockSurface), step: 0.1, suffix: u },
          { key: "stepdown", label: "Step down", type: "number", value: len(p.stepdown), min: 1e-3, step: 0.1, suffix: u },
          { key: "feedrate", label: "Feed rate", type: "number", value: len(p.feedrate), min: 1e-3, step: 10, suffix: `${u}/min` },
          { key: "plungerate", label: "Plunge rate", type: "number", value: len(p.plungerate), min: 1e-3, step: 10, suffix: `${u}/min` },
          {
            key: "direction",
            label: "Direction",
            type: "select",
            value: p.direction,
            options: [
              { label: "Counter-clockwise (climb)", value: 1 },
              { label: "Clockwise (conventional)", value: 2 }
            ]
          },
          { key: "tabSpacing", label: "Tab spacing (0 = off)", type: "number", value: len(p.tabSpacing), min: 0, step: 1, suffix: u },
          { key: "tabWidth", label: "Tab width", type: "number", value: len(p.tabWidth), min: 0, step: 0.1, suffix: u },
          { key: "tabHeight", label: "Tab height", type: "number", value: len(p.tabHeight), min: 0, step: 0.1, suffix: u }
        );
      } else if (type === "pocket") {
        fields.push(
          { key: "safetyHeight", label: "Safety height", type: "number", value: len(p.safetyHeight), step: 0.1, suffix: u },
          { key: "stockSurface", label: "Stock surface", type: "number", value: len(p.stockSurface), step: 0.1, suffix: u },
          { key: "stepover", label: "Step over (%)", type: "number", value: Number((p.stepover * 100).toFixed(2)), min: 1, max: 100, step: 1, suffix: "%" },
          { key: "stepdown", label: "Step down", type: "number", value: len(p.stepdown), min: 1e-3, step: 0.1, suffix: u },
          { key: "roughingClearance", label: "Roughing clearance", type: "number", value: len(p.roughingClearance), min: 0, step: 0.1, suffix: u },
          { key: "feedrate", label: "Feed rate", type: "number", value: len(p.feedrate), min: 1e-3, step: 10, suffix: `${u}/min` },
          { key: "plungerate", label: "Plunge rate", type: "number", value: len(p.plungerate), min: 1e-3, step: 10, suffix: `${u}/min` },
          {
            key: "direction",
            label: "Direction",
            type: "select",
            value: p.direction,
            options: [
              { label: "Counter-clockwise (climb)", value: 1 },
              { label: "Clockwise (conventional)", value: 2 }
            ]
          }
        );
      } else if (type === "follow") {
        fields.push(
          { key: "safetyHeight", label: "Safety height", type: "number", value: len(p.safetyHeight), step: 0.1, suffix: u },
          { key: "stockSurface", label: "Stock surface", type: "number", value: len(p.stockSurface), step: 0.1, suffix: u },
          { key: "stepdown", label: "Step down", type: "number", value: len(p.stepdown), min: 1e-3, step: 0.1, suffix: u },
          { key: "feedrate", label: "Feed rate", type: "number", value: len(p.feedrate), min: 1e-3, step: 10, suffix: `${u}/min` },
          { key: "plungerate", label: "Plunge rate", type: "number", value: len(p.plungerate), min: 1e-3, step: 10, suffix: `${u}/min` }
        );
      } else if (type === "drillpath") {
        fields.push(
          {
            key: "holeCount",
            label: "Number of holes",
            type: "number",
            value: Math.max(1, Math.round(p.holeCount)),
            min: 1,
            step: 1,
            help: "Holes are spaced evenly along each selected path."
          },
          { key: "safetyHeight", label: "Safety height", type: "number", value: len(p.safetyHeight), step: 0.1, suffix: u },
          { key: "stockSurface", label: "Stock surface", type: "number", value: len(p.stockSurface), step: 0.1, suffix: u },
          { key: "stepdown", label: "Peck distance", type: "number", value: len(p.stepdown), min: 1e-3, step: 0.1, suffix: u },
          { key: "plungerate", label: "Plunge rate", type: "number", value: len(p.plungerate), min: 1e-3, step: 10, suffix: `${u}/min` }
        );
      } else {
        fields.push(
          {
            key: "center",
            label: "Drill location",
            type: "select",
            value: p.center,
            options: [
              { label: "Path centre", value: true },
              { label: "Fill pattern", value: false }
            ]
          },
          { key: "spacing", label: "Hole spacing", type: "number", value: len(p.spacing), min: 1e-3, step: 0.5, suffix: u },
          { key: "safetyHeight", label: "Safety height", type: "number", value: len(p.safetyHeight), step: 0.1, suffix: u },
          { key: "stockSurface", label: "Stock surface", type: "number", value: len(p.stockSurface), step: 0.1, suffix: u },
          { key: "stepdown", label: "Peck distance", type: "number", value: len(p.stepdown), min: 1e-3, step: 0.1, suffix: u },
          { key: "plungerate", label: "Plunge rate", type: "number", value: len(p.plungerate), min: 1e-3, step: 10, suffix: `${u}/min` }
        );
      }
      return fields;
    }
    validateOperation(type, v) {
      const n = (key) => typeof v[key] === "number" ? v[key] : Number(v[key]);
      if (!String(v.name ?? "").trim()) return "Give the operation a name.";
      const tool = n("toolDiameter");
      if (!Number.isFinite(tool) || tool <= 0) return "Tool diameter must be greater than zero.";
      const target = n("targetDepth");
      const stock = Number.isFinite(n("stockSurface")) ? n("stockSurface") : 0;
      if (!Number.isFinite(target)) return "Target depth must be a number.";
      if (target >= stock) return "Target depth must be below the stock surface.";
      const safety = n("safetyHeight");
      if (!Number.isFinite(safety) || safety < target) return "Safety height must be above the target depth.";
      const stepdown = n("stepdown");
      if (!Number.isFinite(stepdown) || stepdown <= 0) return "Step down must be greater than zero.";
      const plunge = n("plungerate");
      if (!Number.isFinite(plunge) || plunge <= 0) return "Plunge rate must be greater than zero.";
      if (type !== "drill" && type !== "drillpath") {
        const feed = n("feedrate");
        if (!Number.isFinite(feed) || feed <= 0) return "Feed rate must be greater than zero.";
      }
      if (type === "pocket") {
        const so = n("stepover");
        if (!Number.isFinite(so) || so <= 0 || so > 100) return "Step over must be between 1 and 100%.";
        if (n("roughingClearance") < 0) return "Roughing clearance cannot be negative.";
      }
      if (type === "drill" && v.center === false) {
        const spacing = n("spacing");
        if (!Number.isFinite(spacing) || spacing <= 0) return "Hole spacing must be greater than zero.";
      }
      if (type === "drillpath") {
        const holes = n("holeCount");
        if (!Number.isFinite(holes) || holes < 1 || Math.round(holes) !== holes) {
          return "Number of holes must be a whole number of at least 1.";
        }
      }
      if (type === "profile") {
        const ts = n("tabSpacing");
        const tw = n("tabWidth");
        const th = n("tabHeight");
        const any = ts > 0 || tw > 0 || th > 0;
        if (any && (ts <= 0 || tw <= 0 || th <= 0)) return "For tabs, set spacing, width and height (or set all to 0).";
        if (any && ts <= tw) return "Tab spacing must be greater than the tab width.";
      }
      return null;
    }
    paramsFromValues(type, v) {
      const p = DEFAULT_PARAMS(this.unit);
      const n = (key, fallback) => {
        const raw = v[key];
        const x = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(x) ? x : fallback;
      };
      p.toolDiameter = this.fromDisplay(n("toolDiameter", this.toDisplay(p.toolDiameter)));
      p.targetDepth = this.fromDisplay(n("targetDepth", this.toDisplay(p.targetDepth)));
      p.safetyHeight = this.fromDisplay(n("safetyHeight", this.toDisplay(p.safetyHeight)));
      p.stockSurface = this.fromDisplay(n("stockSurface", this.toDisplay(p.stockSurface)));
      p.stepdown = this.fromDisplay(n("stepdown", this.toDisplay(p.stepdown)));
      p.feedrate = this.fromDisplay(n("feedrate", this.toDisplay(p.feedrate)));
      p.plungerate = this.fromDisplay(n("plungerate", this.toDisplay(p.plungerate)));
      if (type === "profile") {
        p.outside = v.outside !== false;
        p.direction = Number(v.direction) === 2 ? 2 : 1;
        p.tabSpacing = this.fromDisplay(Math.max(0, n("tabSpacing", 0)));
        p.tabWidth = this.fromDisplay(Math.max(0, n("tabWidth", 0)));
        p.tabHeight = this.fromDisplay(Math.max(0, n("tabHeight", 0)));
      } else if (type === "pocket") {
        p.stepover = Math.max(0.01, Math.min(1, n("stepover", 40) / 100));
        p.roughingClearance = this.fromDisplay(Math.max(0, n("roughingClearance", 0)));
        p.direction = Number(v.direction) === 2 ? 2 : 1;
      } else if (type === "drill") {
        p.center = v.center !== false;
        p.spacing = this.fromDisplay(Math.max(1e-3, n("spacing", 1)));
      } else if (type === "drillpath") {
        p.holeCount = Math.max(1, Math.round(n("holeCount", 4)));
      }
      return p;
    }
    editOperation(op) {
      void openDialog({
        title: `Edit ${TYPE_LABEL[op.type].toLowerCase()}`,
        description: op.name,
        fields: this.operationFields(op.type, op),
        submitLabel: "Save and regenerate",
        wide: true,
        validate: (v) => this.validateOperation(op.type, v)
      }).then((values) => {
        if (!values) return;
        this.pushUndo();
        op.name = String(values.name || op.name).trim() || op.name;
        op.params = this.paramsFromValues(op.type, values);
        const warnings = this.regenerateOperation(op);
        this.selectedOperationId = op.id;
        this.updateSelectionUI();
        if (!op.processed) showToast(warnings[0] || "No toolpath generated", "error", 5e3);
        else showToast("Toolpath updated", warnings.length ? "warning" : "success", 2500);
      });
    }
    deleteOperation(op) {
      this.pushUndo();
      this.operations = this.operations.filter((o) => o.id !== op.id);
      if (this.selectedOperationId === op.id) this.selectedOperationId = null;
      this.updateSelectionUI();
      showToast("Operation deleted", "info", 1800);
    }
    moveOperation(op, delta) {
      const i = this.operations.findIndex((o) => o.id === op.id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= this.operations.length) return;
      this.pushUndo();
      const copy = this.operations.slice();
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
      this.operations = copy;
      this.selectedOperationId = op.id;
      this.renderOperations();
      this.requestRender();
      showToast("Operation order updated (G-code follows this list)", "info", 2200);
    }
    addTabsDialog() {
      const op = this.operations.find((o) => o.id === this.selectedOperationId && o.type === "profile");
      if (!op) {
        showToast("Select a profile operation first", "warning", 3e3);
        return;
      }
      const u = this.unitLabel();
      void openDialog({
        title: "Add tabs",
        description: "Tabs leave small uncut bridges so the part does not come loose. Set spacing, width and height.",
        fields: [
          { key: "tabSpacing", label: "Tab spacing", type: "number", value: Number(this.toDisplay(op.params.tabSpacing).toFixed(3)), min: 1e-3, step: 1, suffix: u },
          { key: "tabWidth", label: "Tab width", type: "number", value: Number(this.toDisplay(op.params.tabWidth).toFixed(3)), min: 1e-3, step: 0.1, suffix: u },
          { key: "tabHeight", label: "Tab height", type: "number", value: Number(this.toDisplay(op.params.tabHeight).toFixed(3)), min: 1e-3, step: 0.1, suffix: u }
        ],
        submitLabel: "Apply tabs",
        validate: (v) => {
          const ts = Number(v.tabSpacing);
          const tw = Number(v.tabWidth);
          const th = Number(v.tabHeight);
          if (!(ts > 0 && tw > 0 && th > 0)) return "All tab values must be greater than zero.";
          if (ts <= tw) return "Tab spacing must be greater than the tab width.";
          return null;
        }
      }).then((v) => {
        if (!v) return;
        this.pushUndo();
        op.params.tabSpacing = this.fromDisplay(Number(v.tabSpacing));
        op.params.tabWidth = this.fromDisplay(Number(v.tabWidth));
        op.params.tabHeight = this.fromDisplay(Number(v.tabHeight));
        this.regenerateOperation(op);
        this.selectedOperationId = op.id;
        this.updateSelectionUI();
        this.requestRender();
        showToast("Tabs applied", "success", 2e3);
      });
    }
    renderOperations() {
      const list = document.getElementById("op-list");
      const empty = document.getElementById("op-empty");
      const count = document.getElementById("op-count");
      const exportBtn = document.getElementById("btn-export");
      if (!list) return;
      if (count) {
        count.textContent = this.operations.length === 0 ? "No operations yet" : `${this.operations.length} operation${this.operations.length === 1 ? "" : "s"}`;
      }
      if (exportBtn) {
        exportBtn.disabled = !this.operations.some((o) => o.processed);
      }
      list.innerHTML = "";
      if (this.operations.length === 0) {
        const emptyEl = document.createElement("div");
        emptyEl.className = "op-empty";
        emptyEl.innerHTML = '<p>No CAM operations yet.</p><p class="muted">Select one or more paths and choose <strong>CAM \u2192 Profile</strong>, <strong>Pocket</strong>, <strong>Drill</strong> or <strong>Holes along path</strong>.</p>';
        list.appendChild(emptyEl);
        return;
      }
      if (empty) empty.remove();
      for (const op of this.operations) {
        const item = document.createElement("div");
        item.className = "op-item" + (op.id === this.selectedOperationId ? " selected" : "");
        item.dataset.opId = op.id;
        const swatch = document.createElement("span");
        swatch.className = "op-swatch";
        swatch.style.background = TYPE_COLOR[op.type];
        const main = document.createElement("div");
        main.className = "op-main";
        const name = document.createElement("div");
        name.className = "op-name";
        name.textContent = op.name;
        const meta = document.createElement("div");
        meta.className = "op-meta";
        const bits = [];
        bits.push(TYPE_LABEL[op.type]);
        bits.push(`\xD8 ${this.fmtLen(op.params.toolDiameter, 2)} ${this.unit}`);
        bits.push(`depth ${this.fmtLen(op.params.targetDepth, 2)} ${this.unit}`);
        if ((op.type === "drill" || op.type === "drillpath") && op.processed) {
          bits.push(`${op.drillPoints.length} hole${op.drillPoints.length === 1 ? "" : "s"}`);
        } else if (op.processed) {
          bits.push(`${op.loops.length} loop${op.loops.length === 1 ? "" : "s"}`);
        }
        for (const b of bits) {
          const span = document.createElement("span");
          span.textContent = b;
          meta.appendChild(span);
        }
        if (!op.processed) {
          const badge = document.createElement("span");
          badge.className = "op-badge warn";
          badge.textContent = "no toolpath";
          meta.appendChild(badge);
        }
        if (!op.visible) {
          const badge = document.createElement("span");
          badge.className = "op-badge";
          badge.textContent = "hidden";
          meta.appendChild(badge);
        }
        main.appendChild(name);
        main.appendChild(meta);
        const actions = document.createElement("div");
        actions.className = "op-actions";
        const vis = document.createElement("input");
        vis.type = "checkbox";
        vis.className = "op-visibility";
        vis.checked = op.visible;
        vis.title = "Show / hide toolpath";
        vis.addEventListener("click", (e) => e.stopPropagation());
        vis.addEventListener("change", () => {
          op.visible = vis.checked;
          this.requestRender();
          this.renderOperations();
        });
        const index = this.operations.indexOf(op);
        const up = document.createElement("button");
        up.type = "button";
        up.title = "Move earlier in the machining order";
        up.textContent = "\u2191";
        up.disabled = index <= 0;
        up.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveOperation(op, -1);
        });
        const down = document.createElement("button");
        down.type = "button";
        down.title = "Move later in the machining order";
        down.textContent = "\u2193";
        down.disabled = index >= this.operations.length - 1;
        down.addEventListener("click", (e) => {
          e.stopPropagation();
          this.moveOperation(op, 1);
        });
        const edit = document.createElement("button");
        edit.type = "button";
        edit.title = "Edit";
        edit.textContent = "\u270E";
        edit.addEventListener("click", (e) => {
          e.stopPropagation();
          this.editOperation(op);
        });
        const del = document.createElement("button");
        del.type = "button";
        del.title = "Delete";
        del.textContent = "\u2715";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          void confirmDialog(`Delete "${op.name}"?`, "Delete operation").then((yes) => {
            if (yes) this.deleteOperation(op);
          });
        });
        actions.appendChild(up);
        actions.appendChild(down);
        actions.appendChild(edit);
        actions.appendChild(del);
        item.appendChild(vis);
        item.appendChild(swatch);
        item.appendChild(main);
        item.appendChild(actions);
        item.addEventListener("click", () => {
          this.selectedOperationId = op.id;
          this.updateSelectionUI();
          this.renderOperations();
        });
        item.addEventListener("dblclick", () => this.editOperation(op));
        list.appendChild(item);
      }
    }
    /* ------------------------------------------------------------------ */
    /* Insert shapes                                                       */
    /* ------------------------------------------------------------------ */
    viewCenterWorld() {
      const rect = this.canvas.getBoundingClientRect();
      return screenToWorld(this.view, { x: rect.width / 2, y: rect.height / 2 });
    }
    insertShapeDialog() {
      void openDialog({
        title: "Insert shape",
        description: "The shape is placed at the centre of the current view.",
        fields: [
          {
            key: "shape",
            label: "Shape",
            type: "select",
            value: "circle",
            options: [
              { label: "Circle", value: "circle" },
              { label: "Ellipse", value: "ellipse" },
              { label: "Rectangle", value: "rectangle" },
              { label: "Rounded rectangle", value: "roundedrect" },
              { label: "Polygon", value: "polygon" },
              { label: "Star", value: "star" }
            ]
          }
        ],
        submitLabel: "Continue"
      }).then((v) => {
        if (v) void this.insertShape(v.shape);
      });
    }
    async insertShape(shape) {
      const u = this.unitLabel();
      const mm = (x) => this.fromDisplay(x);
      let fields = [];
      if (shape === "circle") {
        fields = [{ key: "diameter", label: "Diameter", type: "number", value: this.toDisplay(25.4), min: 1e-3, step: 1, suffix: u }];
      } else if (shape === "ellipse") {
        fields = [
          { key: "width", label: "Width", type: "number", value: this.toDisplay(50.8), min: 1e-3, step: 1, suffix: u },
          { key: "height", label: "Height", type: "number", value: this.toDisplay(25.4), min: 1e-3, step: 1, suffix: u }
        ];
      } else if (shape === "rectangle") {
        fields = [
          { key: "width", label: "Width", type: "number", value: this.toDisplay(50.8), min: 1e-3, step: 1, suffix: u },
          { key: "height", label: "Height", type: "number", value: this.toDisplay(38.1), min: 1e-3, step: 1, suffix: u }
        ];
      } else if (shape === "roundedrect") {
        fields = [
          { key: "width", label: "Width", type: "number", value: this.toDisplay(50.8), min: 1e-3, step: 1, suffix: u },
          { key: "height", label: "Height", type: "number", value: this.toDisplay(38.1), min: 1e-3, step: 1, suffix: u },
          { key: "radius", label: "Corner radius", type: "number", value: this.toDisplay(5), min: 0, step: 0.5, suffix: u }
        ];
      } else if (shape === "polygon") {
        fields = [
          { key: "sides", label: "Number of sides", type: "number", value: 6, min: 3, step: 1 },
          { key: "radius", label: "Radius", type: "number", value: this.toDisplay(25.4), min: 1e-3, step: 1, suffix: u }
        ];
      } else if (shape === "star") {
        fields = [
          { key: "points", label: "Number of points", type: "number", value: 6, min: 3, step: 1 },
          { key: "radius", label: "Outer radius", type: "number", value: this.toDisplay(25.4), min: 1e-3, step: 1, suffix: u },
          { key: "pointiness", label: "Pointiness (%)", type: "number", value: 50, min: 1, max: 99, step: 1, suffix: "%" }
        ];
      }
      const values = await openDialog({
        title: `Insert ${shape === "roundedrect" ? "rounded rectangle" : shape}`,
        fields,
        submitLabel: "Insert",
        validate: (v) => {
          for (const f of fields) {
            if (f.type !== "number") continue;
            const n2 = Number(v[f.key]);
            if (!Number.isFinite(n2)) return `${f.label} must be a number.`;
            if (f.min !== void 0 && n2 < f.min) return `${f.label} is too small.`;
            if (f.max !== void 0 && n2 > f.max) return `${f.label} is too large.`;
          }
          return null;
        }
      });
      if (!values) return;
      const c = this.viewCenterWorld();
      const n = (k) => Number(values[k]);
      let path;
      let label = shape;
      if (shape === "circle") {
        const r = mm(n("diameter")) / 2;
        path = ellipsePath(c.x, c.y, r, r);
        label = "Circle";
      } else if (shape === "ellipse") {
        path = ellipsePath(c.x, c.y, mm(n("width")) / 2, mm(n("height")) / 2);
        label = "Ellipse";
      } else if (shape === "rectangle") {
        const w = mm(n("width"));
        const h = mm(n("height"));
        path = rectPath(c.x - w / 2, c.y - h / 2, w, h);
        label = "Rectangle";
      } else if (shape === "roundedrect") {
        const w = mm(n("width"));
        const h = mm(n("height"));
        path = roundedRectPath(c.x - w / 2, c.y - h / 2, w, h, mm(n("radius")));
        label = "Rounded rectangle";
      } else if (shape === "polygon") {
        path = polygonPath(c.x, c.y, mm(n("radius")), n("sides"), Math.PI / 2);
        label = "Polygon";
      } else {
        path = starPath(c.x, c.y, mm(n("radius")), n("points"), n("pointiness"));
        label = "Star";
      }
      this.pushUndo();
      path.id = this.newPathId();
      path.name = label;
      this.paths.push(path);
      this.selection.clear();
      this.selection.add(path.id);
      this.selectedOperationId = null;
      this.updateSelectionUI();
      this.updateEmptyState();
      this.requestRender();
    }
    /* ------------------------------------------------------------------ */
    /* Transformations                                                     */
    /* ------------------------------------------------------------------ */
    selectionCenter() {
      const selected = this.selectedPaths();
      if (selected.length === 0) return null;
      let b = null;
      for (const p of selected) b = boundsUnion(b, polygonBounds(flattenPath(p, 0.2)));
      if (!b) return null;
      return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
    }
    applyTransformToSelection(m, label) {
      const selected = this.selectedPaths();
      if (selected.length === 0) {
        showToast("Select one or more paths first", "info", 2200);
        return;
      }
      this.pushUndo();
      const ids = new Set(selected.map((p) => p.id));
      this.paths = this.paths.map((p) => p.id && ids.has(p.id) ? transformPath(p, m) : p);
      this.regenerateAll(true);
      this.updateSelectionUI();
      this.requestRender();
      showToast(label, "success", 1800);
    }
    scaleDialog() {
      const center = this.selectionCenter();
      if (!center) {
        showToast("Select one or more paths first", "info", 2200);
        return;
      }
      void openDialog({
        title: "Scale selection",
        fields: [
          { key: "sx", label: "Scale X (%)", type: "number", value: 100, step: 1, suffix: "%" },
          { key: "sy", label: "Scale Y (%)", type: "number", value: 100, step: 1, suffix: "%" }
        ],
        submitLabel: "Scale",
        validate: (v) => !Number.isFinite(Number(v.sx)) || !Number.isFinite(Number(v.sy)) || Number(v.sx) === 0 || Number(v.sy) === 0 ? "Scale values must be non-zero numbers." : null
      }).then((v) => {
        if (!v) return;
        const sx = Number(v.sx) / 100;
        const sy = Number(v.sy) / 100;
        const m = matrixMultiply(
          matrixMultiply(matrixTranslate(center.x, center.y), matrixScale(sx, sy)),
          matrixTranslate(-center.x, -center.y)
        );
        this.applyTransformToSelection(m, "Selection scaled");
      });
    }
    rotateDialog() {
      const center = this.selectionCenter();
      if (!center) {
        showToast("Select one or more paths first", "info", 2200);
        return;
      }
      void openDialog({
        title: "Rotate selection",
        fields: [{ key: "angle", label: "Angle", type: "number", value: 0, step: 1, suffix: "\xB0" }],
        submitLabel: "Rotate",
        validate: (v) => Number.isFinite(Number(v.angle)) ? null : "Enter an angle in degrees."
      }).then((v) => {
        if (!v) return;
        const angle = Number(v.angle);
        if (angle === 0) return;
        const m = matrixMultiply(
          matrixMultiply(matrixTranslate(center.x, center.y), matrixRotate(angle * Math.PI / 180)),
          matrixTranslate(-center.x, -center.y)
        );
        this.applyTransformToSelection(m, "Selection rotated");
      });
    }
    skewDialog() {
      const center = this.selectionCenter();
      if (!center) {
        showToast("Select one or more paths first", "info", 2200);
        return;
      }
      void openDialog({
        title: "Skew selection",
        fields: [
          { key: "skx", label: "Skew X (%)", type: "number", value: 0, step: 1, suffix: "%" },
          { key: "sky", label: "Skew Y (%)", type: "number", value: 0, step: 1, suffix: "%" }
        ],
        submitLabel: "Skew"
      }).then((v) => {
        if (!v) return;
        const skx = Number(v.skx) || 0;
        const sky = Number(v.sky) || 0;
        if (skx === 0 && sky === 0) return;
        const skew = {
          a: 1,
          b: Math.tan(-sky / 100),
          c: Math.tan(-skx / 100),
          d: 1,
          e: 0,
          f: 0
        };
        const m = matrixMultiply(
          matrixMultiply(matrixTranslate(center.x, center.y), skew),
          matrixTranslate(-center.x, -center.y)
        );
        this.applyTransformToSelection(m, "Selection skewed");
      });
    }
    /* ------------------------------------------------------------------ */
    /* File operations                                                     */
    /* ------------------------------------------------------------------ */
    async readFile(file) {
      try {
        const text = await file.text();
        await this.importText(text, file.name);
      } catch (e) {
        showError("Could not read the file", e.message);
      }
    }
    async importText(text, filename = "drawing.svg", replace = false) {
      try {
        const project = parseProject(text, { pxPerInch: this.pxPerInch });
        if (project) {
          this.loadProject(project, filename);
          return;
        }
        const imported = parseSvg(text, { pxPerInch: this.pxPerInch });
        if (imported.paths.length === 0) {
          showError("Nothing to import", imported.warnings.join("\n") || "No supported geometry was found.");
          return;
        }
        this.pushUndo();
        if (replace) {
          this.paths = [];
          this.operations = [];
          this.selection.clear();
          this.selectedOperationId = null;
          this.nextPathId = 1;
          this.nextOperationId = 1;
        }
        for (const p of imported.paths) {
          p.id = this.newPathId();
          this.paths.push(p);
        }
        this.selection.clear();
        this.selectedOperationId = null;
        this.updateSelectionUI();
        this.updateEmptyState();
        requestAnimationFrame(() => this.fit());
        showToast(
          `Imported ${imported.paths.length} path${imported.paths.length === 1 ? "" : "s"} from ${filename}`,
          "success",
          3500
        );
        if (imported.warnings.length > 0) {
          showToast(imported.warnings.slice(0, 3).join(" "), "warning", 7e3);
        }
      } catch (e) {
        showError("Could not import SVG", e.message);
      }
    }
    loadProject(project, filename) {
      this.pushUndo();
      this.paths = project.paths;
      this.ensurePathIds(this.paths);
      this.nextOperationId = 1;
      this.operations = [];
      this.operations = project.operations.map((def) => ({
        id: def.id || this.newOperationId(),
        type: def.type,
        name: def.name,
        params: def.params,
        pathIds: def.pathIds,
        loops: [],
        drillPoints: [],
        processed: false,
        visible: true
      }));
      this.selection.clear();
      this.selectedOperationId = this.operations[0]?.id ?? null;
      this.regenerateAll(true);
      this.updateSelectionUI();
      this.updateEmptyState();
      this.renderOperations();
      requestAnimationFrame(() => this.fit());
      showToast(
        `Opened ${filename}: ${this.paths.length} paths, ${this.operations.length} operations`,
        "success",
        4e3
      );
      if (project.warnings.length > 0) {
        showToast(project.warnings.slice(0, 3).join(" "), "warning", 7e3);
      }
    }
    saveProject() {
      if (this.paths.length === 0) {
        showToast("There is nothing to save yet", "info", 2200);
        return;
      }
      const defs = this.operations.map((op) => ({
        id: op.id,
        type: op.type,
        name: op.name,
        params: op.params,
        pathIds: op.pathIds
      }));
      const svg = serializeProject(this.paths, defs, this.unit);
      downloadText("makercam-project.svg", svg, "image/svg+xml");
      showToast("Project saved (SVG + CAM metadata)", "success", 2600);
    }
    exportGcodeDialog() {
      const processed = this.operations.filter((o) => o.processed);
      if (processed.length === 0) {
        showToast("Create and generate at least one toolpath first", "warning", 3e3);
        return;
      }
      const fields = [
        {
          key: "unit",
          label: "Output units",
          type: "select",
          value: this.unit,
          options: [
            { label: "Millimetres (G21)", value: "mm" },
            { label: "Inches (G20)", value: "in" }
          ]
        },
        { key: "sep", type: "label", wide: true, label: "Toolpaths to export:" }
      ];
      for (const op of processed) {
        fields.push({
          key: `op_${op.id}`,
          label: `${op.name} \u2014 ${TYPE_LABEL[op.type]}, \xD8 ${this.fmtLen(op.params.toolDiameter)} ${this.unit}`,
          type: "checkbox",
          value: true,
          wide: true
        });
      }
      void openDialog({
        title: "Export G-code",
        description: "Only generated toolpaths are listed. The file uses one tool change per distinct cutter.",
        fields,
        submitLabel: "Download .nc",
        wide: true,
        validate: (v) => {
          const any = processed.some((op) => v[`op_${op.id}`] === true);
          return any ? null : "Select at least one toolpath.";
        }
      }).then((v) => {
        if (!v) return;
        const selected = processed.filter((op) => v[`op_${op.id}`] === true);
        const outputUnit = v.unit === "in" ? "in" : "mm";
        const gcode = generateGcode(selected, outputUnit, this.tolerance);
        if (!gcode) {
          showToast("The selected toolpaths produced no G-code", "error", 3200);
          return;
        }
        downloadText("part.nc", gcode, "text/plain");
        const est = selected.reduce((sum, op) => sum + estimateTime(op), 0);
        showToast(
          `G-code exported: ${selected.length} toolpath${selected.length === 1 ? "" : "s"}, ~${Math.max(1, Math.round(est))} min`,
          "success",
          4e3
        );
      });
    }
    /* ------------------------------------------------------------------ */
    /* Nesting                                                             */
    /* ------------------------------------------------------------------ */
    setNestBoundary() {
      const selected = this.selectedPaths().filter((p) => isClosedPath(p));
      if (selected.length !== 1) {
        showToast("Select exactly one closed path to use as the material boundary", "warning", 3500);
        return;
      }
      this.nestBoundaryId = selected[0].id;
      this.updateHint(`Material boundary: ${selected[0].name || "path"}`);
      showToast("Material boundary set", "success", 2200);
    }
    runNestDialog() {
      const boundary = this.paths.find((p) => p.id === this.nestBoundaryId);
      if (!boundary || !isClosedPath(boundary)) {
        showToast("Set a closed material boundary first (Nesting \u2192 Set material boundary)", "warning", 4200);
        return;
      }
      const ops = this.operations.filter((o) => o.processed && o.pathIds.length > 0 && !o.pathIds.includes(this.nestBoundaryId));
      if (ops.length < 2) {
        showToast("At least two generated toolpaths are required for nesting", "warning", 3500);
        return;
      }
      const u = this.unitLabel();
      void openDialog({
        title: "Nest toolpaths",
        description: "Pack the generated toolpaths inside the boundary, trying several rotations.",
        fields: [
          { key: "gap", label: "Space between objects", type: "number", value: Number(this.toDisplay(3).toFixed(3)), min: 0, step: 0.5, suffix: u },
          {
            key: "rotations",
            label: "Rotations to try",
            type: "select",
            value: 8,
            options: [
              { label: "4 (0\xB0, 90\xB0, 180\xB0, 270\xB0)", value: 4 },
              { label: "8 (45\xB0 steps)", value: 8 },
              { label: "12 (30\xB0 steps)", value: 12 },
              { label: "16 (22.5\xB0 steps)", value: 16 }
            ]
          }
        ],
        submitLabel: "Nest"
      }).then((v) => {
        if (!v) return;
        this.runNest(boundary, ops, this.fromDisplay(Number(v.gap) || 0), Number(v.rotations) || 8);
      });
    }
    runNest(boundary, ops, gap, rotationCount) {
      const boundaryPoints = closedPolygon(boundary, 0.1);
      if (boundaryPoints.length < 3) {
        showToast("The boundary path is invalid", "error", 3e3);
        return;
      }
      const items = [];
      const outlines = [];
      for (const op of ops) {
        const paths = this.pathsForOperation(op);
        const points = [];
        for (const p of paths) {
          for (const q of flattenPath(p, 0.3)) points.push(q);
          for (const seg of p.segments) {
            if (seg.kind === "cubic") {
              points.push(seg.c1, seg.c2);
            } else if (seg.kind === "quad") {
              points.push(seg.c);
            }
          }
        }
        if (points.length < 3) {
          outlines.push([]);
          items.push({ outline: [], sourceLoops: op.loops });
          continue;
        }
        let hull = convexHull(points);
        const buffer = op.params.toolDiameter / 2 + gap / 2;
        if (buffer > 0 && hull.length >= 3) {
          const buffered = offsetRegion(
            [{ points: hull, depth: 0, closed: true, pocketDepth: 0, tabs: [] }],
            buffer
          );
          if (buffered.length > 0) {
            const outer = buffered.filter((l) => l.depth % 2 === 0).sort((a, b2) => Math.abs(polygonArea(b2.points)) - Math.abs(polygonArea(a.points)))[0];
            if (outer) hull = outer.points;
          }
        }
        outlines.push(hull);
        items.push({ outline: hull, sourceLoops: op.loops });
      }
      const b = polygonBounds(boundaryPoints);
      const step = Math.max(1, Math.min(10, Math.max(b.maxX - b.minX, b.maxY - b.minY) / 120));
      const rotations = Array.from({ length: rotationCount }, (_, i) => i * 2 * Math.PI / rotationCount);
      let placements;
      try {
        placements = nestItems(boundaryPoints, items, { gap, rotations, step });
      } catch (e) {
        showError("Nesting failed", e.message);
        return;
      }
      if (placements.length === 0) {
        showToast("None of the objects fit inside the boundary", "warning", 4200);
        return;
      }
      this.pushUndo();
      const applied = /* @__PURE__ */ new Set();
      for (const placement of placements) {
        const op = ops[placement.index];
        if (!op) continue;
        const m = matrixMultiply(matrixTranslate(placement.position.x, placement.position.y), matrixRotate(placement.rotation));
        const pathIds = this.pathsForOperation(op).map((p) => p.id).filter(Boolean);
        for (const id of pathIds) {
          if (applied.has(id)) continue;
          const idx = this.paths.findIndex((p) => p.id === id);
          if (idx >= 0) {
            this.paths[idx] = transformPath(this.paths[idx], m);
            applied.add(id);
          }
        }
      }
      this.regenerateAll(true);
      this.updateSelectionUI();
      this.requestRender();
      showToast(
        `Nested ${placements.length} of ${ops.length} operations (${applied.size} paths moved)`,
        placements.length < ops.length ? "warning" : "success",
        5e3
      );
    }
    /* ------------------------------------------------------------------ */
    /* Example project                                                     */
    /* ------------------------------------------------------------------ */
    loadExample() {
      try {
        const imported = parseSvg(EXAMPLE_SVG, { pxPerInch: this.pxPerInch });
        if (imported.paths.length === 0) {
          showError("Could not load the example", "The bundled example SVG produced no geometry.");
          return;
        }
        this.pushUndo();
        this.paths = [];
        this.operations = [];
        this.selection.clear();
        this.selectedOperationId = null;
        this.nextPathId = 1;
        this.nextOperationId = 1;
        this.nestBoundaryId = null;
        for (const p of imported.paths) {
          p.id = this.newPathId();
          this.paths.push(p);
        }
        const bySource = /* @__PURE__ */ new Map();
        for (const p of this.paths) {
          if (p.sourceId) bySource.set(p.sourceId, p);
        }
        const base = DEFAULT_PARAMS("mm");
        const add = (type, name, params, paths) => {
          const op = {
            id: this.newOperationId(),
            type,
            name,
            params,
            pathIds: paths.map((p) => p.id).filter(Boolean),
            loops: [],
            drillPoints: [],
            processed: false,
            visible: true
          };
          this.regenerateOperation(op);
          this.operations.push(op);
          return op;
        };
        const holes = ["hole1", "hole2"].map((id) => bySource.get(id)).filter((p) => !!p);
        if (holes.length > 0) {
          add(
            "drill",
            "Bolt holes",
            {
              ...base,
              toolDiameter: 5,
              targetDepth: -8,
              safetyHeight: 12,
              stockSurface: 0,
              stepdown: 2,
              feedrate: 300,
              plungerate: 250,
              center: true
            },
            holes
          );
        }
        const pocket = bySource.get("pocket");
        if (pocket) {
          add(
            "pocket",
            "Inner pocket",
            {
              ...base,
              toolDiameter: 6.35,
              targetDepth: -4,
              safetyHeight: 12,
              stockSurface: 0,
              stepdown: 2,
              stepover: 0.4,
              roughingClearance: 0,
              feedrate: 800,
              plungerate: 300,
              direction: 1
            },
            [pocket]
          );
        }
        const outline = bySource.get("outline");
        if (outline) {
          add(
            "profile",
            "Plate outline",
            {
              ...base,
              toolDiameter: 6.35,
              targetDepth: -6,
              safetyHeight: 12,
              stockSurface: 0,
              stepdown: 2,
              feedrate: 900,
              plungerate: 300,
              outside: true,
              direction: 1,
              tabSpacing: 60,
              tabWidth: 6,
              tabHeight: 3
            },
            [outline]
          );
        }
        this.selectedOperationId = this.operations[this.operations.length - 1]?.id ?? null;
        this.regenerateAll(true);
        this.updateSelectionUI();
        this.updateEmptyState();
        requestAnimationFrame(() => this.fit());
        showToast("Example loaded: drill, pocket and profile", "success", 4e3);
        if (imported.warnings.length > 0) {
          showToast(imported.warnings.slice(0, 2).join(" "), "warning", 5e3);
        }
      } catch (e) {
        showError("Could not load the example", e.message);
      }
    }
    /* ------------------------------------------------------------------ */
    /* Preferences and help                                                */
    /* ------------------------------------------------------------------ */
    preferencesDialog() {
      void openDialog({
        title: "Preferences",
        fields: [
          {
            key: "pxPerInch",
            label: "SVG import resolution",
            type: "number",
            value: this.pxPerInch,
            min: 1,
            step: 1,
            suffix: "px/in",
            help: "Illustrator/Flash commonly use 72; Inkscape and CSS use 90/96."
          },
          {
            key: "tolerance",
            label: "CAM curve tolerance",
            type: "number",
            value: this.tolerance,
            min: 1e-3,
            step: 1e-3,
            suffix: "mm",
            help: "Smaller values produce smoother curves and more G-code."
          },
          { key: "grid", label: "Show grid", type: "checkbox", value: this.grid },
          { key: "snap", label: "Snap to grid", type: "checkbox", value: this.snap },
          { key: "showToolpaths", label: "Show toolpaths", type: "checkbox", value: this.showToolpaths },
          { key: "showToolDiameter", label: "Show cutter diameter", type: "checkbox", value: this.showToolDiameter }
        ],
        submitLabel: "Save",
        validate: (v) => {
          if (!(Number(v.pxPerInch) > 0)) return "Import resolution must be greater than zero.";
          if (!(Number(v.tolerance) > 0)) return "Tolerance must be greater than zero.";
          return null;
        }
      }).then((v) => {
        if (!v) return;
        this.pxPerInch = Number(v.pxPerInch);
        this.tolerance = Number(v.tolerance);
        this.grid = !!v.grid;
        this.snap = !!v.snap;
        this.showToolpaths = !!v.showToolpaths;
        this.showToolDiameter = !!v.showToolDiameter;
        this.savePrefs();
        const gridBtn = document.getElementById("btn-grid");
        gridBtn?.classList.toggle("active", this.grid);
        const snapBtn = document.getElementById("btn-snap");
        snapBtn?.classList.toggle("active", this.snap);
        const tpBtn = document.getElementById("btn-show-toolpaths");
        tpBtn?.classList.toggle("active", this.showToolpaths);
        const tdBtn = document.getElementById("btn-show-diameter");
        tdBtn?.classList.toggle("active", this.showToolDiameter);
        this.regenerateAll(true);
        this.requestRender();
        showToast("Preferences saved", "success", 2e3);
      });
    }
    quickGuide() {
      void openDialog({
        title: "Quick guide",
        description: "The same workflow as the original MakerCam, in a modern browser.",
        fields: [
          { key: "a", type: "label", wide: true, label: "1. Import an SVG with File \u2192 Import SVG, or insert a shape from the Insert menu." },
          { key: "b", type: "label", wide: true, label: "2. Use Select (V) to click paths, Shift-click to add, and drag to move. Scroll to zoom; hold Space to pan." },
          { key: "c", type: "label", wide: true, label: "3. Choose CAM \u2192 Profile, Pocket, Follow path, Drill or Holes along path. Closed paths are required for profile/pocket/drill." },
          { key: "d", type: "label", wide: true, label: "4. Inspect the green/orange toolpaths. Select an operation in the sidebar to edit or delete it." },
          { key: "e", type: "label", wide: true, label: "5. Export G-code from the Toolpaths menu or the sidebar button. Save the project as SVG to keep operations." },
          { key: "f", type: "label", wide: true, label: "Tip: CAM \u2192 Add tabs leaves bridges on profile cuts. Use Show cutter diameter to preview the material removal." }
        ],
        submitLabel: "Got it"
      });
    }
    about() {
      void openDialog({
        title: `About ${APP_NAME}`,
        description: "A modern TypeScript/Canvas port of PartKam / MakerCam, the browser-based 2.5D CAM tool written in ActionScript 3 by Jack Clark circa 2010. The original is LGPL-3.0; this port is derived from its source and is distributed under the same license.",
        fields: [
          { key: "a", type: "label", wide: true, label: "Features: SVG import, interactive editing, profile/pocket/follow/drill/holes-along-path toolpaths, tabs, nesting, and G-code export." },
          { key: "b", type: "label", wide: true, label: "Geometry is processed in millimetres. G-code can be written in millimetres (G21) or inches (G20)." },
          { key: "c", type: "label", wide: true, label: "Always verify toolpaths and G-code before running a machine." }
        ],
        submitLabel: "Close"
      });
    }
    /* ------------------------------------------------------------------ */
    /* Command routing                                                     */
    /* ------------------------------------------------------------------ */
    async handleCommand(cmd) {
      switch (cmd) {
        case "file-import":
          this.fileInput.click();
          break;
        case "file-open-project":
          this.fileInput.click();
          break;
        case "file-save":
          this.saveProject();
          break;
        case "file-export":
          this.exportGcodeDialog();
          break;
        case "file-new":
          if (await confirmDialog("Start a new project? Unsaved changes will be lost.", "New project")) {
            this.pushUndo();
            this.paths = [];
            this.operations = [];
            this.selection.clear();
            this.selectedOperationId = null;
            this.nextPathId = 1;
            this.nextOperationId = 1;
            this.nestBoundaryId = null;
            this.updateSelectionUI();
            this.updateEmptyState();
            this.fit();
          }
          break;
        case "edit-undo":
          this.undo();
          break;
        case "edit-redo":
          this.redo();
          break;
        case "edit-selectall":
          this.selectAll();
          break;
        case "edit-copy":
          this.copySelection();
          break;
        case "edit-paste":
          this.pasteSelection();
          break;
        case "edit-delete":
          this.deleteSelection();
          break;
        case "edit-scale":
          this.scaleDialog();
          break;
        case "edit-rotate":
          this.rotateDialog();
          break;
        case "edit-skew":
          this.skewDialog();
          break;
        case "edit-preferences":
          this.preferencesDialog();
          break;
        case "insert-circle":
          await this.insertShape("circle");
          break;
        case "insert-ellipse":
          await this.insertShape("ellipse");
          break;
        case "insert-rectangle":
          await this.insertShape("rectangle");
          break;
        case "insert-roundedrect":
          await this.insertShape("roundedrect");
          break;
        case "insert-polygon":
          await this.insertShape("polygon");
          break;
        case "insert-star":
          await this.insertShape("star");
          break;
        case "cam-profile":
          await this.createOperation("profile");
          break;
        case "cam-pocket":
          await this.createOperation("pocket");
          break;
        case "cam-follow":
          await this.createOperation("follow");
          break;
        case "cam-drill":
          await this.createOperation("drill");
          break;
        case "cam-drillpath":
          await this.createOperation("drillpath");
          break;
        case "cam-tabs":
          this.addTabsDialog();
          break;
        case "cam-regenerate":
          this.pushUndo();
          this.regenerateAll();
          showToast("Toolpaths regenerated", "success", 2200);
          break;
        case "cam-delete": {
          const op = this.operations.find((o) => o.id === this.selectedOperationId);
          if (op) void confirmDialog(`Delete "${op.name}"?`, "Delete operation").then((yes) => yes && this.deleteOperation(op));
          else showToast("Select an operation in the sidebar first", "info", 2200);
          break;
        }
        case "toolpaths-export":
          this.exportGcodeDialog();
          break;
        case "toolpaths-toggle":
          this.toggleToolpaths();
          break;
        case "toolpaths-diameter":
          this.toggleToolDiameter();
          break;
        case "toolpaths-refit":
          this.fit();
          break;
        case "nest-boundary":
          this.setNestBoundary();
          break;
        case "nest-run":
          this.runNestDialog();
          break;
        case "help-example":
          this.loadExample();
          break;
        case "help-guide":
          this.quickGuide();
          break;
        case "help-about":
          this.about();
          break;
      }
    }
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new App());
  } else {
    new App();
  }
})();
//# sourceMappingURL=app.js.map
