const def = require('./def');

/**
 * Build a descriptor template using a simple property syntax.
 * 
 * TODO: document this further.
 * 
 * @alias module:@lumjs/core/types~DescriptorTemplate
 */
function DescriptorTemplate()
{
  if (!new.target) return new DescriptorTemplate();
  def(this, '_v', true);
}

const dp = DescriptorTemplate.prototype;

function pa(prop)
{
  return(
  {
    get() 
    { // Set a regular, enumerable, writable value.
      this[prop] = this._v;
      return this;
    }
  });
}

function va(value)
{
  return(
  {
    get()
    { // Set a hidden, but configurable value. 
      def(this, '_v', value);
      return this;
    }
  });
}

def(dp, 'is',  va(true));
def(dp, 'not', va(false));
def(dp, 'e', pa('enumerable'));
def(dp, 'c', pa('configurable'));
def(dp, 'w', pa('writable'));

function na(accessor)
{
  return(
  {
    get()
    {
      const dt = new DescriptorTemplate();
      return dt[accessor];
    }
  });
}

const DTA = ['is','not','e','c','w'];

DescriptorTemplate.addTo = function(target)
{
  for (const a of DTA)
  {
    def(target, a, na(a));
  }
}

module.exports = DescriptorTemplate;
