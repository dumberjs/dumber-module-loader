define.switchToUserSpace();
define('a', ['b', 'lorem!./c'], (b, c) => b + c);
define('lorem!c', [], () => 1);
define.switchToPackageSpace();
define('b', [], () => 2);
define.switchToUserSpace();
