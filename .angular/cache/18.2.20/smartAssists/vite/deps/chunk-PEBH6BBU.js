import {
  __read,
  __spreadArray,
  argsOrArgArray,
  filter,
  not,
  raceWith
<<<<<<<< HEAD:.angular/cache/18.2.20/smartAssists/vite/deps/chunk-ISM5WLAM.js
} from "./chunk-ZZ67MR3E.js";
========
} from "./chunk-4S3KYZTJ.js";
>>>>>>>> 6911ff6734c133560aa4009cbbce1e08bc2fae1f:.angular/cache/18.2.20/smartAssists/vite/deps/chunk-PEBH6BBU.js

// node_modules/rxjs/dist/esm5/internal/operators/partition.js
function partition(predicate, thisArg) {
  return function(source) {
    return [filter(predicate, thisArg)(source), filter(not(predicate, thisArg))(source)];
  };
}

// node_modules/rxjs/dist/esm5/internal/operators/race.js
function race() {
  var args = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    args[_i] = arguments[_i];
  }
  return raceWith.apply(void 0, __spreadArray([], __read(argsOrArgArray(args))));
}

export {
  partition,
  race
};
<<<<<<<< HEAD:.angular/cache/18.2.20/smartAssists/vite/deps/chunk-ISM5WLAM.js
//# sourceMappingURL=chunk-ISM5WLAM.js.map
========
//# sourceMappingURL=chunk-PEBH6BBU.js.map
>>>>>>>> 6911ff6734c133560aa4009cbbce1e08bc2fae1f:.angular/cache/18.2.20/smartAssists/vite/deps/chunk-PEBH6BBU.js
