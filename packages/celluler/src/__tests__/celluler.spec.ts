import Celluler from '../Celluler';

describe('Celluler class test', () => {
  it('works if true is truthy', () => {
    expect(true).toBeTruthy();
  });

  it('Celluler is instantiable', () => {
    expect(new Celluler()).toBeInstanceOf(Celluler);
  });
});
